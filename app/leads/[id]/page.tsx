"use server";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  User,
  Clock,
  Tag,
  Lightbulb,
  FileText,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import AssignLeadDropdown from "@/components/AssignLeadDropdown";
import StatusDropdown from "@/components/StatusDropdown";

interface Props {
  params: Promise<{ id: string }>;
}

type Contacto = {
  id: string;
  business_id?: string | null;
  assigned_user_id?: string | null;
  whatsapp: string;
  nombre: string | null;
  resumen: string | null;
  ultimo_tema: string | null;
  necesidad: string | null;
  estado: string | null;
  veces_contacto: number | null;
  ultima_respuesta: string | null;
  notas?: string | null;
};

type Mensaje = {
  id: string;
  whatsapp: string;
  texto: string | null;
  tipo: "cliente" | "bot" | null;
  created_at: string | null;
};

type SellerOption = {
  user_id: string;
  role: string | null;
  email: string;
};

const ESTADOS = [
  { key: "interesado", label: "Interesado", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { key: "llamar", label: "Llamar", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { key: "contactado", label: "Contactado", color: "bg-violet-100 text-violet-700 border-violet-200" },
  { key: "cliente", label: "Cliente", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { key: "perdido", label: "Perdido", color: "bg-rose-100 text-rose-700 border-rose-200" },
];

function getEstadoStyle(estado: string | null) {
  return ESTADOS.find((e) => e.key === (estado || "").toLowerCase()) || ESTADOS[0];
}

function formatTime(dateString: string | null) {
  if (!dateString) return "";
  try {
    return new Intl.DateTimeFormat("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
    }).format(new Date(dateString));
  } catch {
    return "";
  }
}

async function saveNotes(formData: FormData) {
  "use server";
  const { createClient: createAdminClient } = await import("@supabase/supabase-js");
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const leadId = String(formData.get("leadId") || "").trim();
  const notas = String(formData.get("notas") || "").trim();
  if (!leadId) return;
  await supabase.from("contactos").update({ notas }).eq("id", leadId);
  revalidatePath(`/leads/${leadId}`);
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: businessUser } = await supabase
    .from("business_users")
    .select("business_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!businessUser?.business_id) return <ErrorBox text="Usuario sin negocio asignado." />;

  const businessId = businessUser.business_id;
  const isAdmin = (businessUser.role || "").toLowerCase() === "admin";

  const { data: lead, error } = await supabase
    .from("contactos")
    .select("*")
    .eq("id", id.trim())
    .maybeSingle();

  if (!lead || error) return <ErrorBox text="Lead no encontrado." />;
  if (lead.business_id !== businessId) return <ErrorBox text="Lead pertenece a otro negocio." />;
  if (!isAdmin && lead.assigned_user_id !== user.id) return <ErrorBox text="No tienes acceso a este lead." />;

  const contacto = lead as Contacto;

  const { data: mensajesData } = await supabase
    .from("mensajes_recibidos")
    .select("*")
    .eq("whatsapp", contacto.whatsapp)
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  const mensajes: Mensaje[] = mensajesData || [];

  let sellerOptions: SellerOption[] = [];
  if (isAdmin) {
    const { data: sellers } = await supabase
      .from("business_users")
      .select("user_id, role, email")
      .eq("business_id", businessId)
      .eq("role", "seller");
    sellerOptions = (sellers || []).map((s) => ({
      user_id: s.user_id,
      role: s.role,
      email: s.email || "Sin email",
    }));
  }

  const estadoStyle = getEstadoStyle(contacto.estado);
  const initials = (contacto.nombre || contacto.whatsapp || "?")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-5">

        {/* BACK */}
        <Link href="/leads" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" />
          Volver a leads
        </Link>

        {/* HEADER */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] px-4 md:px-6 py-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {initials}
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-bold text-white">
                    {contacto.nombre || "Sin nombre"}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-3.5 h-3.5 text-white    " />
                    <span className="text-white    text-sm">{contacto.whatsapp}</span>
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${estadoStyle.color} flex-shrink-0`}>
                {estadoStyle.label}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 md:gap-4 mt-5 pt-5 border-t border-white/10">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <MessageCircle className="w-4 h-4 text-white    " />
                <span>{mensajes.length} mensajes</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Clock className="w-4 h-4 text-white    " />
                <span>{contacto.veces_contacto || 0} contactos</span>
              </div>
              {contacto.ultima_respuesta && (
                <div className="flex items-center gap-2 text-sm text-white">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Último: {formatTime(contacto.ultima_respuesta)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action bar */}
          <div className="px-4 md:px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-2 md:gap-3">
            <a
              href={`https://wa.me/${contacto.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Abrir </span>WhatsApp
            </a>
            <a
              href={`tel:+${contacto.whatsapp}`}
              className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Llamar
            </a>

            <div className="flex items-center gap-2 ml-auto flex-wrap justify-end">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">Estado:</span>
                <StatusDropdown
                  id={contacto.id}
                  current={contacto.estado || "interesado"}
                />
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">Asignado:</span>
                  <AssignLeadDropdown
                    leadId={contacto.id}
                    currentAssignedUserId={contacto.assigned_user_id || null}
                    sellerOptions={sellerOptions}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-5">

          {/* CHAT — col span 3 */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col order-2 lg:order-1">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-white    " />
              <h2 className="font-semibold text-slate-800">Conversación</h2>
              <span className="ml-auto text-xs text-white    ">{mensajes.length} mensajes</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3 bg-[#ECE5DD]" style={{ maxHeight: "520px", minHeight: "300px" }}>
              {mensajes.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                  Sin mensajes aún
                </div>
              ) : (
                mensajes.map((msg) => {
                  const isBot = msg.tipo === "bot";
                  return (
                    <div key={msg.id} className={`flex ${isBot ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] md:max-w-[78%] flex flex-col gap-1 ${isBot ? "items-end" : "items-start"}`}>
                        <span className="text-[10px] text-slate-400 px-1">
                          {isBot ? "Bot" : "Cliente"} · {formatTime(msg.created_at)}
                        </span>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isBot ? "bg-[#73af7f] text-white rounded-tr-none shadow-sm" : "bg-white text-white     rounded-tl-none border border-slate-200 shadow-sm"}`}>
                          {msg.texto}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANEL — col span 2 */}
          <div className="lg:col-span-2 space-y-4 order-1 lg:order-2">

            {/* Resumen IA — arriba */}
            {contacto.resumen && (
              <div className="bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] rounded-2xl p-5">
                <p className="text-xs text-white     font-medium uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Resumen IA
                </p>
                <p className="text-sm text-white     leading-relaxed">{contacto.resumen}</p>
              </div>
            )}

            {/* Info */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                Información del lead
              </h2>
              <InfoRow icon={<Tag className="w-3.5 h-3.5" />} label="Estado" value={estadoStyle.label} />
              <InfoRow icon={<MessageCircle className="w-3.5 h-3.5" />} label="Último tema" value={contacto.ultimo_tema} />
              <InfoRow icon={<Lightbulb className="w-3.5 h-3.5" />} label="Necesidad" value={contacto.necesidad} />
            </div>

            {/* Notas */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-slate-400" />
                Notas
              </h2>
              <form action={saveNotes}>
                <input type="hidden" name="leadId" value={contacto.id} />
                <textarea
                  name="notas"
                  defaultValue={contacto.notas || ""}
                  rows={4}
                  placeholder="Agrega notas sobre este lead..."
                  className="w-full text-sm text-slate-700 border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-slate-300 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="mt-2 w-full py-2 bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-opacity"
                >
                  Guardar nota
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-400 mt-0.5">{icon}</span>
      <div>
        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-slate-700 mt-0.5">{value || "—"}</p>
      </div>
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-red-100 p-10 text-center max-w-md">
        <p className="text-red-500 font-semibold text-lg">{text}</p>
        <Link href="/leads" className="mt-4 inline-block text-sm text-slate-500 hover:text-slate-800">
          ← Volver a leads
        </Link>
      </div>
    </div>
  );
}