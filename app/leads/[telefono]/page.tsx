import Link from "next/link";
import { ArrowLeft, MessageCircle, Phone, User, Tag, FileText } from "lucide-react";
import { getLeadsFromSheet } from "@/lib/googleSheets";
import { saveLeadNotes } from "./actions";

interface Props {
  params: Promise<{
    telefono: string;
  }>;
}

export default async function LeadDetailPage({ params }: Props) {
  const { telefono } = await params;
  const leads = await getLeadsFromSheet();

  const lead = leads.find(
    (l) => String(l.telefono).trim() === String(telefono).trim()
  );

  if (!lead) {
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
          <h1 className="text-2xl font-bold text-gray-900">Lead no encontrado</h1>
          <p className="mt-2 text-sm text-gray-600">
            No se encontró un registro con ese teléfono dentro del CRM.
          </p>
        </div>
      </div>
    );
  }

  const phone = String(lead.telefono || "").trim();
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

          <p className="mt-5 text-sm font-medium uppercase tracking-wide text-gray-500">
            Ficha del lead
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            {lead.nombre || "Sin nombre"}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StatusBadge status={lead.estado || "Sin estado"} />

            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              <Phone size={14} />
              {phone}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              <User size={14} />
              {lead.fuente || "Sin fuente"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/leads"
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            Ver lista
          </Link>

          {whatsappPhone ? (
            <a
              href={`https://wa.me/${whatsappPhone}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              <MessageCircle size={16} />
              Abrir WhatsApp
            </a>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-gray-100 p-3 text-gray-800">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Resumen de conversación
                </h2>
                <p className="text-sm text-gray-500">
                  Interpretación generada desde el flujo del bot.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-gray-50 p-5">
              <p className="text-sm leading-7 text-gray-800">
                {lead.resumenConversacion || "Sin resumen disponible."}
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <InfoCard title="Mensaje inicial" value={lead.mensajeInicial || "Sin dato"} />
            <InfoCard title="Último mensaje" value={lead.ultimoMensaje || "Sin dato"} />
            <InfoCard title="Último tema" value={lead.ultimoTema || "Sin dato"} />
            <InfoCard
              title="Necesidad detectada"
              value={lead.necesidadDetectada || "Sin clasificar"}
            />
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              Última respuesta del bot
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Último mensaje enviado automáticamente por el sistema.
            </p>

            <div className="mt-5 rounded-2xl bg-gray-50 p-5">
              <p className="text-sm leading-7 text-gray-800">
                {lead.ultimaRespuestaBot || "Sin respuesta registrada."}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              Información general
            </h2>

            <div className="mt-5 space-y-4">
              <KeyValue label="Nombre" value={lead.nombre || "Sin nombre"} />
              <KeyValue label="Teléfono" value={phone || "Sin teléfono"} />
              <KeyValue label="Fuente" value={lead.fuente || "Sin fuente"} />
              <KeyValue label="Estado" value={lead.estado || "Sin estado"} />
              <KeyValue
                label="Fecha de contacto"
                value={lead.fechaContacto || "Sin registro"}
              />
              <KeyValue
                label="Último contacto"
                value={lead.ultimoContacto || "Sin registro"}
              />
              <KeyValue
                label="Veces de contacto"
                value={String(lead.vecesContacto ?? 0)}
              />
            </div>
          </div>

<div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
  <div className="flex items-center gap-3">
    <div className="rounded-2xl bg-gray-100 p-3 text-gray-800">
      <Tag size={20} />
    </div>
    <div>
      <h2 className="text-xl font-semibold text-gray-900">Clasificación</h2>
      <p className="text-sm text-gray-500">
        Datos útiles para seguimiento comercial.
      </p>
    </div>
  </div>

  <div className="mt-5 space-y-4">
    <KeyValue
      label="Vendedor asignado"
      value={lead.etiqueta || "Sin asignar"}
    />
    <KeyValue label="wamid" value={lead.wamid || "Sin wamid"} />
  </div>
</div>

<div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
  <h2 className="text-xl font-semibold text-gray-900">Notas internas</h2>
  <p className="mt-1 text-sm text-gray-500">
    Agrega observaciones manuales y guárdalas en el CRM.
  </p>

  <form action={saveLeadNotes} className="mt-5 space-y-4">
    <input type="hidden" name="telefono" value={phone} />

    <textarea
      name="notas"
      defaultValue={lead.notas || ""}
      rows={6}
      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-gray-400"
      placeholder="Escribe aquí observaciones del lead..."
    />

    <button
      type="submit"
      className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
    >
      Guardar notas
    </button>
  </form>
</div>





        </div>
      </section>
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
      <span className="max-w-[60%] text-right text-sm font-semibold text-gray-900 break-words">
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
    ["seguimiento", "interesado", "interesadoo"].includes(normalized)
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