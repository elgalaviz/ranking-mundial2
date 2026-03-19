import Link from "next/link";
import { Search, ArrowUpRight, MessageCircle } from "lucide-react";
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

export default async function LeadsPage() {
  const { data, error } = await supabaseServer
    .from("contactos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
        Error cargando leads: {error.message}
      </div>
    );
  }

  const leads: Contacto[] = data ?? [];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            CRM WhatsApp IA
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Leads
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Visualiza, revisa y da seguimiento a todos los leads captados por el
            bot desde WhatsApp.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Ir al dashboard
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Base de leads
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {leads.length} registro{leads.length === 1 ? "" : "s"} disponible
              {leads.length === 1 ? "" : "s"} en el CRM.
            </p>
          </div>

          <div className="flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 md:max-w-sm">
            <Search size={18} className="text-gray-400" />
            <span className="text-sm text-gray-400">
              Buscador visual próximamente
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-black">
            <thead className="bg-gray-50 text-left text-gray-700">
              <tr>
                <th className="px-5 py-4 font-semibold">Nombre</th>
                <th className="px-5 py-4 font-semibold">WhatsApp</th>
                <th className="px-5 py-4 font-semibold">Estado</th>
                <th className="px-5 py-4 font-semibold">Último tema</th>
                <th className="px-5 py-4 font-semibold">Necesidad</th>
                <th className="px-5 py-4 font-semibold text-center">
                  Contactos
                </th>
                <th className="px-5 py-4 font-semibold text-center">Acción</th>
              </tr>
            </thead>

            <tbody>
              {leads.length > 0 ? (
                leads.map((lead) => {
                  const phone = String(lead.whatsapp || "").trim();
                  const whatsappPhone = normalizeMexPhone(phone);

                  return (
                    <tr
                      key={lead.id}
                      className="border-t border-gray-100 transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/leads/${phone}`}
                          className="font-semibold text-black hover:underline"
                        >
                          {lead.nombre || "Sin nombre"}
                        </Link>
                        <p className="mt-1 text-xs text-gray-500">
                          Lead registrado
                        </p>
                      </td>

                      <td className="px-5 py-4 text-gray-800">{phone}</td>

                      <td className="px-5 py-4">
                        <StatusBadge status={lead.estado || "Sin estado"} />
                      </td>

                      <td className="px-5 py-4 text-gray-800">
                        {lead.ultimo_tema || "Sin tema"}
                      </td>

                      <td className="px-5 py-4 text-gray-800">
                        {lead.necesidad || "Sin clasificar"}
                      </td>

                      <td className="px-5 py-4 text-center font-semibold text-black">
                        {lead.veces_contacto ?? 0}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/leads/${phone}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                          >
                            Ver ficha
                          </Link>

                          {whatsappPhone ? (
                            <a
                              href={`https://wa.me/${whatsappPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
                            >
                              <MessageCircle size={14} />
                              WhatsApp
                            </a>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    No hay leads disponibles todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase().trim();

  let classes =
    "inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ";

  if (["nuevo"].includes(normalized)) {
    classes += "bg-blue-50 text-blue-700 ring-blue-200";
  } else if (
    ["seguimiento", "interesado", "interesadoo", "evaluando"].includes(
      normalized
    )
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

function normalizeMexPhone(phone: string) {
  const cleaned = phone.replace(/\D/g, "");

  if (!cleaned) return "";

  if (cleaned.startsWith("52") && cleaned.length >= 12) {
    return cleaned;
  }

  if (cleaned.length === 10) {
    return `52${cleaned}`;
  }

  return cleaned;
}