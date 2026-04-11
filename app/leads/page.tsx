import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import StatusDropdown from "@/components/StatusDropdown";
import AssignLeadDropdown from "@/components/AssignLeadDropdown";
import ExportLeadsButton from "@/components/ExportLeadsButton";
import { RefreshButton } from "@/components/RefreshButton";
import { AutoRefreshOnFocus } from "@/components/AutoRefreshOnFocus";

type SearchParams = {
  estado?: string;
  view?: string;
};

type Contacto = {
  id: string;
  whatsapp: string | null;
  nombre: string | null;
  resumen: string | null;
  ultimo_tema: string | null;
  necesidad: string | null;
  estado: string | null;
  veces_contacto: number | null;
  created_at: string | null;
  ultima_respuesta: string | null;
  assigned_user_id: string | null;
};

type BusinessUser = {
  user_id: string;
  business_id: string;
  role: string | null;
  email: string | null;
};

type SellerOption = {
  user_id: string;
  role: string | null;
  email: string;
};

const ESTADOS_TABLA = [
  { key: "interesado", label: "Interesados" },
  { key: "llamar", label: "Llamar" },
  { key: "contactado", label: "Contactados" },
  { key: "cliente", label: "Clientes" },
  { key: "perdido", label: "Perdidos" },
];

const ESTADOS_PIPELINE = [
  { key: "interesado", label: "Interesados" },
  { key: "llamar", label: "Llamar" },
  { key: "contactado", label: "Contactados" },
];

function formatDate(dateString: string | null) {
  if (!dateString) return "Sin fecha";

  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateString));
  } catch {
    return "Sin fecha";
  }
}

function getEstadoLabel(estado: string | null) {
  if (!estado) return "Sin estado";
  const found = ESTADOS_TABLA.find((e) => e.key === estado.toLowerCase());
  return found?.label || estado;
}

function getBadgeClasses(estado: string | null) {
  const value = (estado || "").toLowerCase();

  if (value === "interesado") return "bg-blue-100 text-blue-800";
  if (value === "llamar") return "bg-amber-100 text-amber-800";
  if (value === "contactado") return "bg-violet-100 text-violet-800";
  if (value === "cliente") return "bg-emerald-100 text-emerald-800";
  if (value === "perdido") return "bg-rose-100 text-rose-800";

  return "bg-neutral-100 text-neutral-700";
}

function buildLeadsUrl({
  estado,
  view,
}: {
  estado?: string;
  view?: string;
}) {
  const params = new URLSearchParams();

  if (estado) params.set("estado", estado);
  if (view) params.set("view", view);

  const qs = params.toString();
  return qs ? `/leads?${qs}` : "/leads";
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const resolvedSearchParams = await searchParams;
  const estadoFiltro = (resolvedSearchParams?.estado || "").toLowerCase().trim();
  const view =
    resolvedSearchParams?.view === "pipeline" ? "pipeline" : "table";

  const { data: businessUserData, error: businessUserError } = await supabase
    .from("business_users")
    .select("user_id, business_id, role, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (businessUserError) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          Error cargando usuario del negocio: {businessUserError.message}
        </div>
      </div>
    );
  }

  const businessUser = businessUserData as BusinessUser | null;
  const role = String(businessUser?.role || "").toLowerCase().trim();
  const isAdmin = role === "admin";

  let sellerOptions: SellerOption[] = [];

  if (isAdmin && businessUser?.business_id) {
    const { data: sellersData } = await supabase
      .from("business_users")
      .select("user_id, role, email")
      .eq("business_id", businessUser.business_id)
      .eq("role", "seller");

    sellerOptions =
      ((sellersData ?? []) as Array<{
        user_id: string;
        role: string | null;
        email: string | null;
      }>).map((seller) => ({
        user_id: seller.user_id,
        role: seller.role,
        email: seller.email || "Sin email",
      }));
  }

  let contactosQuery = supabase
    .from("contactos")
    .select(
      "id, whatsapp, nombre, resumen, ultimo_tema, necesidad, estado, veces_contacto, created_at, ultima_respuesta, assigned_user_id"
    )
    .order("ultima_respuesta", { ascending: false });

  if (!isAdmin) {
    contactosQuery = contactosQuery.eq("assigned_user_id", user.id);
  }

  if (estadoFiltro) {
    contactosQuery = contactosQuery.eq("estado", estadoFiltro);
  }

  const { data: contactosData, error: contactosError } = await contactosQuery;

  if (contactosError) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          Error cargando leads: {contactosError.message}
        </div>
      </div>
    );
  }

  const contactos = (contactosData ?? []) as Contacto[];

  const titulo = isAdmin ? "Leads" : "Mis leads";
  const subtitulo = isAdmin
    ? "Vista operativa de todos los leads del sistema."
    : "Aquí ves únicamente los leads asignados a ti.";

  const filtroActivoLabel = estadoFiltro ? getEstadoLabel(estadoFiltro) : null;

  const columnas: Record<string, Contacto[]> = {
    interesado: [],
    llamar: [],
    contactado: [],
  };

  contactos.forEach((lead) => {
    const key = (lead.estado || "interesado").toLowerCase();
    if (columnas[key]) {
      columnas[key].push(lead);
    }
  });

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* ✅ NUEVO: Auto-refresh al volver a la pestaña */}
      <AutoRefreshOnFocus />
      
      <div className="px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al dashboard
            </Link>

            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
              {titulo}
            </h1>

            <p className="mt-1 text-sm text-neutral-600">{subtitulo}</p>

            {filtroActivoLabel ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-800">
                  Mostrando: {filtroActivoLabel}
                </span>

                <Link
                  href={buildLeadsUrl({ view })}
                  className="text-sm font-medium text-neutral-600 underline underline-offset-4 transition hover:text-neutral-900"
                >
                  Ver todos
                </Link>
              </div>
            ) : (
              <div className="mt-3">
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700">
                  Mostrando todos
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* ✅ NUEVO: Botón de actualización manual */}
            <RefreshButton />
            
            <ExportLeadsButton estado={estadoFiltro || undefined} />
            <div className="inline-flex rounded-xl border border-neutral-200 bg-white p-1 shadow-sm">
              <Link
                href={buildLeadsUrl({
                  estado: estadoFiltro || undefined,
                  view: "table",
                })}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  view === "table"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                Tabla
              </Link>

              <Link
                href={buildLeadsUrl({
                  estado: estadoFiltro || undefined,
                  view: "pipeline",
                })}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  view === "pipeline"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                Pipeline
              </Link>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm">
              <span className="font-medium text-neutral-900">{contactos.length}</span>{" "}
              {contactos.length === 1 ? "lead" : "leads"}
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-medium text-neutral-700">
              Estados rápidos
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={buildLeadsUrl({ view })}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  !estadoFiltro
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                Todos
              </Link>

              {ESTADOS_TABLA.map((estado) => (
                <Link
                  key={estado.key}
                  href={buildLeadsUrl({ estado: estado.key, view })}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    estadoFiltro === estado.key
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {estado.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {view === "pipeline" ? (
          <div className="overflow-x-auto pb-4 scroll-smooth">
            <div className="flex w-max gap-4 px-2">
              {ESTADOS_PIPELINE.map((columna) => {
                const leadsColumna = columnas[columna.key] || [];

                return (
                  <div
                    key={columna.key}
                    className="w-[260px] shrink-0 rounded-2xl border border-neutral-200 bg-white shadow-sm"
                  >
                    <div className="rounded-t-2xl border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="font-semibold text-neutral-900">
                          {columna.label}
                        </h2>
                        <span className="rounded-full bg-neutral-200 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                          {leadsColumna.length}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 p-3">
                      {leadsColumna.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-400">
                          Sin leads
                        </div>
                      ) : (
                        leadsColumna.map((lead) => {
                          const assignedUser = sellerOptions.find(
                            (seller) => seller.user_id === lead.assigned_user_id
                          );

                          return (
                            <div
                              key={lead.id}
                              className="rounded-lg border border-neutral-200 bg-white p-2 shadow-sm"
                            >
                              <div className="mb-2 flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h3 className="truncate text-xs font-semibold text-neutral-900">
                                    {lead.nombre || "Sin nombre"}
                                  </h3>
                                  <p className="truncate text-[11px] text-neutral-500">
                                    {lead.whatsapp || "Sin WhatsApp"}
                                  </p>
                                </div>

                                <span
                                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${getBadgeClasses(
                                    lead.estado
                                  )}`}
                                >
                                  {getEstadoLabel(lead.estado)}
                                </span>
                              </div>

                              <div className="mb-2 text-[10px] text-neutral-400">
                                {formatDate(lead.ultima_respuesta || lead.created_at)}
                              </div>

                              <div className="space-y-2">
                                <StatusDropdown
                                  id={lead.id}
                                  current={lead.estado || ""}
                                />

                                {isAdmin && (
                                  <div className="space-y-1">
                                    <div className="text-[11px] text-neutral-500">
                                      {assignedUser?.email || "Sin asignar"}
                                    </div>

                                    <AssignLeadDropdown
                                      leadId={lead.id}
                                      currentAssignedUserId={lead.assigned_user_id || ""}
                                      sellerOptions={sellerOptions}
                                    />
                                  </div>
                                )}

                                <Link
                                  href={`/leads/${lead.id}`}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-neutral-700 underline underline-offset-4"
                                >
                                  Ver
                                  <ArrowUpRight className="h-3 w-3" />
                                </Link>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm lg:block">
              {contactos.length === 0 ? (
                <div className="p-6 text-sm text-neutral-500">
                  No hay leads para mostrar.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-neutral-50">
                      <tr className="text-left text-neutral-600">
                        <th className="px-4 py-3 font-medium">Nombre</th>
                        <th className="px-4 py-3 font-medium">WhatsApp</th>
                        <th className="px-4 py-3 font-medium">Estado</th>
                        {isAdmin && (
                          <th className="px-4 py-3 font-medium">Asignado</th>
                        )}
                        <th className="px-4 py-3 font-medium">Necesidad</th>
                        <th className="px-4 py-3 font-medium">Última actividad</th>
                        <th className="px-4 py-3 font-medium">Detalle</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-neutral-100">
                      {contactos.map((lead) => {
                        const assignedUser = sellerOptions.find(
                          (seller) => seller.user_id === lead.assigned_user_id
                        );

                        return (
                          <tr key={lead.id} className="align-top">
                            <td className="px-4 py-4">
                              <div className="font-medium text-neutral-900">
                                {lead.nombre || "Sin nombre"}
                              </div>
                              {lead.resumen && (
                                <div className="mt-1 line-clamp-2 max-w-xs text-xs text-neutral-500">
                                  {lead.resumen}
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-4 text-neutral-700">
                              {lead.whatsapp || "Sin WhatsApp"}
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-2">
                                <span
                                  className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${getBadgeClasses(
                                    lead.estado
                                  )}`}
                                >
                                  {getEstadoLabel(lead.estado)}
                                </span>

                                <StatusDropdown
                                  id={lead.id}
                                  current={lead.estado || ""}
                                />
                              </div>
                            </td>

                            {isAdmin && (
                              <td className="px-4 py-4">
                                <div className="flex flex-col gap-2">
                                  <div className="text-sm text-neutral-700">
                                    {assignedUser?.email || "Sin asignar"}
                                  </div>

                                  <AssignLeadDropdown
                                    leadId={lead.id}
                                    currentAssignedUserId={
                                      lead.assigned_user_id || ""
                                    }
                                    sellerOptions={sellerOptions}
                                  />
                                </div>
                              </td>
                            )}

                            <td className="px-4 py-4">
                              <div className="max-w-md text-neutral-700">
                                {lead.necesidad || "Sin necesidad detectada"}
                              </div>
                            </td>

                            <td className="px-4 py-4 text-neutral-500">
                              {formatDate(
                                lead.ultima_respuesta || lead.created_at
                              )}
                            </td>

                            <td className="px-4 py-4">
                              <Link
                                href={`/leads/${lead.id}`}
                                className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                              >
                                Ver
                                <ArrowUpRight className="h-4 w-4" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="space-y-4 lg:hidden">
              {contactos.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500 shadow-sm">
                  No hay leads para mostrar.
                </div>
              ) : (
                contactos.map((lead) => {
                  const assignedUser = sellerOptions.find(
                    (seller) => seller.user_id === lead.assigned_user_id
                  );

                  return (
                    <div
                      key={lead.id}
                      className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-neutral-900">
                            {lead.nombre || "Sin nombre"}
                          </h3>
                          <p className="mt-1 text-sm text-neutral-600">
                            {lead.whatsapp || "Sin WhatsApp"}
                          </p>
                        </div>

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getBadgeClasses(
                            lead.estado
                          )}`}
                        >
                          {getEstadoLabel(lead.estado)}
                        </span>
                      </div>

                      {lead.necesidad && (
                        <p className="mb-3 text-sm text-neutral-700">
                          {lead.necesidad}
                        </p>
                      )}

                      <div className="mb-3 text-xs text-neutral-500">
                        Última actividad:{" "}
                        {formatDate(lead.ultima_respuesta || lead.created_at)}
                      </div>

                      <div className="space-y-3">
                        <StatusDropdown
                          id={lead.id}
                          current={lead.estado || ""}
                        />

                        {isAdmin && (
                          <div className="space-y-2">
                            <div className="text-sm text-neutral-600">
                              Asignado: {assignedUser?.email || "Sin asignar"}
                            </div>

                            <AssignLeadDropdown
                              leadId={lead.id}
                              currentAssignedUserId={lead.assigned_user_id || ""}
                              sellerOptions={sellerOptions}
                            />
                          </div>
                        )}

                        <Link
                          href={`/leads/${lead.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-neutral-700 underline underline-offset-4"
                        >
                          Ver detalle
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}