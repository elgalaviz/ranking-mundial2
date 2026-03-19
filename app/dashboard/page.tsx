import Link from "next/link";
import type { ReactNode } from "react";
import {
  Users,
  UserPlus,
  Clock3,
  CheckCircle2,
  MessageSquare,
  ArrowUpRight,
} from "lucide-react";
import { supabaseServer } from "@/lib/supabase/server";

type Contacto = {
  id: string;
  whatsapp: string;
  nombre: string | null;
  resumen: string | null;
  ultimo_tema: string | null;
  necesidad: string | null;
  estado: string | null;
  veces_contacto: number | null;
  created_at: string | null;
  ultima_respuesta: string | null;
};

export default async function DashboardPage() {
  const { data, error } = await supabaseServer
    .from("contactos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
        Error cargando contactos: {error.message}
      </div>
    );
  }

  const leads: Contacto[] = data ?? [];

  const totalLeads = leads.length;

  const nuevos = leads.filter(
    (lead) => (lead.estado || "").toLowerCase() === "nuevo"
  ).length;

  const seguimiento = leads.filter((lead) =>
    ["seguimiento", "interesado", "interesadoo", "evaluando"].includes(
      (lead.estado || "").toLowerCase()
    )
  ).length;

  const cerrados = leads.filter((lead) =>
    ["cerrado", "ganado", "cliente"].includes((lead.estado || "").toLowerCase())
  ).length;

  const recientes = [...leads].slice(0, 5);

  const necesidadesMap = leads.reduce<Record<string, number>>((acc, lead) => {
    const key = lead.necesidad?.trim() || "Sin clasificar";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const necesidadesTop = Object.entries(necesidadesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxNecesidad = necesidadesTop.length
    ? Math.max(...necesidadesTop.map((n) => n[1]))
    : 1;

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            CRM WhatsApp IA
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Dashboard de leads
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Revisa el rendimiento del bot, identifica oportunidades y da
            seguimiento a los leads captados desde WhatsApp.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/leads"
            className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Ver leads
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total leads"
          value={totalLeads}
          icon={<Users size={20} />}
          helper="Todos los registros captados"
        />

        <StatCard
          title="Nuevos"
          value={nuevos}
          icon={<UserPlus size={20} />}
          helper="Entradas recientes"
        />

        <StatCard
          title="En seguimiento"
          value={seguimiento}
          icon={<Clock3 size={20} />}
          helper="Leads activos"
        />

        <StatCard
          title="Cerrados"
          value={cerrados}
          icon={<CheckCircle2 size={20} />}
          helper="Conversión o cierre"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Leads recientes
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Últimos contactos registrados en el CRM.
              </p>
            </div>

            <Link
              href="/leads"
              className="text-sm font-medium text-gray-700 hover:text-black"
            >
              Ver todos
            </Link>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="px-4 py-3 font-semibold">WhatsApp</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Necesidad</th>
                </tr>
              </thead>
              <tbody>
                {recientes.length > 0 ? (
                  recientes.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-t border-gray-100 text-black"
                    >
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="hover:underline"
                        >
                          {lead.nombre || "Sin nombre"}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{lead.whatsapp}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={lead.estado || "Sin estado"} />
                      </td>
                      <td className="px-4 py-3">
                        {lead.necesidad || "Sin clasificar"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-gray-500"
                    >
                      No hay leads disponibles.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              Necesidades detectadas
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Temas más repetidos en las conversaciones.
            </p>

            <div className="mt-5 space-y-4">
              {necesidadesTop.length > 0 ? (
                necesidadesTop.map(([name, count]) => (
                  <div key={name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-800">{name}</span>
                      <span className="text-gray-500">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-gray-900"
                        style={{
                          width: `${Math.max(12, (count / maxNecesidad) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  Aún no hay necesidades clasificadas.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-gray-100 p-3 text-gray-800">
                <MessageSquare size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Resumen rápido
                </h2>
                <p className="text-sm text-gray-500">
                  Vista general del comportamiento del CRM.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4 text-sm text-gray-700">
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                <span>Leads captados</span>
                <strong className="text-black">{totalLeads}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                <span>Leads nuevos</span>
                <strong className="text-black">{nuevos}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                <span>En seguimiento</span>
                <strong className="text-black">{seguimiento}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                <span>Cerrados</span>
                <strong className="text-black">{cerrados}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  helper,
  icon,
}: {
  title: string;
  value: number;
  helper: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-3 text-4xl font-bold tracking-tight text-black">
            {value}
          </h3>
          <p className="mt-2 text-sm text-gray-500">{helper}</p>
        </div>

        <div className="rounded-2xl bg-gray-100 p-3 text-gray-800">{icon}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  let classes =
    "inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ";

  if (["nuevo"].includes(normalized)) {
    classes += "bg-blue-50 text-blue-700 ring-blue-200";
  } else if (
    ["seguimiento", "interesado", "interesadoo", "evaluando"].includes(normalized)
  ) {
    classes += "bg-amber-50 text-amber-700 ring-amber-200";
  } else if (["cerrado", "ganado", "cliente"].includes(normalized)) {
    classes += "bg-emerald-50 text-emerald-700 ring-emerald-200";
  } else if (["perdido"].includes(normalized)) {
    classes += "bg-red-50 text-red-700 ring-red-200";
  } else {
    classes += "bg-gray-100 text-gray-700 ring-gray-200";
  }

  return <span className={classes}>{status}</span>;
}