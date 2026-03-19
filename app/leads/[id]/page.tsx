import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  Phone,
  User,
} from "lucide-react";
import { supabaseServer } from "@/lib/supabase/server";

interface Props {
  params: Promise<{
    id: string;
  }>;
}



type Contacto = {
  id: string;
  whatsapp: string;
  nombre: string | null;
  resumen: string | null;
  ultimo_tema: string | null;
  necesidad: string | null;
  estado: string | null;
  veces_contacto: number | null;
  ultima_respuesta: string | null;
};

export default async function LeadDetailPage({ params }: Props) {
 const { id } = await params;

 const { data: lead, error } = await supabaseServer
  .from("contactos")
  .select("*")
.eq("id", id.trim())
  .single();

  console.log("ID recibido:", id);
console.log("Lead:", lead);
console.log("Error:", error);

  if (!lead || error) {
    return (
      <div className="space-y-6">
        <Link
          href="/leads"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
        >
          <ArrowLeft size={16} />
          Volver a leads
        </Link>

        <div className="rounded-3xl border border-gray-200 bg-white p-10 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Lead no encontrado
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            No se encontró un registro con ese ID dentro del CRM.
          </p>
        </div>
      </div>
    );
  }

  const contacto = lead as Contacto;
  const phone = String(contacto.whatsapp || "").trim();
  const whatsappPhone = normalizeMexPhone(phone);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/leads"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
          >
            <ArrowLeft size={16} />
            Volver a leads
          </Link>

          <p className="mt-5 text-sm uppercase text-gray-500">
            Ficha del lead
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            {contacto.nombre || "Sin nombre"}
          </h1>

          <div className="mt-4 flex flex-wrap gap-3">
            <StatusBadge status={contacto.estado || "Sin estado"} />

            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              <Phone size={14} />
              {phone || "Sin WhatsApp"}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              <User size={14} />
              WhatsApp Lead
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          {whatsappPhone ? (
            <a
              href={`https://wa.me/${whatsappPhone}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <Card title="Resumen de conversación">
            {contacto.resumen || "Sin resumen disponible"}
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <InfoCard title="Último tema" value={contacto.ultimo_tema || "-"} />
            <InfoCard title="Necesidad" value={contacto.necesidad || "-"} />
          </div>

          <Card title="Última respuesta del bot">
            {contacto.ultima_respuesta || "Sin respuesta"}
          </Card>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Información</h2>

            <div className="mt-5 space-y-4">
              <KeyValue label="Nombre" value={contacto.nombre || "-"} />
              <KeyValue label="WhatsApp" value={phone || "-"} />
              <KeyValue label="Estado" value={contacto.estado || "-"} />
              <KeyValue
                label="Contactos"
                value={String(contacto.veces_contacto ?? 0)}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Clasificación</h2>

            <div className="mt-5 space-y-4">
              <KeyValue label="Estado" value={contacto.estado || "-"} />
              <KeyValue label="Necesidad" value={contacto.necesidad || "-"} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* COMPONENTES */

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-gray-800">{children}</p>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-gray-800">{value}</p>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-gray-50 px-4 py-3">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="max-w-[60%] break-words text-right text-sm font-semibold text-gray-900">
        {value}
      </span>
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
    ["seguimiento", "interesado", "evaluando", "LLamada"].includes(normalized)
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