import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { Bot, Sparkles, Package, MessageSquare, Settings, CheckCircle2, ShoppingBag } from "lucide-react";
import UploadCatalogo from "@/components/UploadCatalogo";

type Business = {
  id: string;
  name: string | null;
  slogan: string | null;
  descripcion: string | null;
  servicios: string | null;
  instrucciones_bot: string | null;
  tono_bot: string | null;
  catalogo: Record<string, unknown>[] | null;
  catalogo_updated_at: string | null;
};

async function saveConfig(formData: FormData) {
  "use server";
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const businessId = String(formData.get("businessId") || "").trim();
  if (!businessId) return;

  await supabase.from("businesses").update({
    slogan: String(formData.get("slogan") || "").trim() || null,
    descripcion: String(formData.get("descripcion") || "").trim() || null,
    servicios: String(formData.get("servicios") || "").trim() || null,
    instrucciones_bot: String(formData.get("instrucciones_bot") || "").trim() || null,
    tono_bot: String(formData.get("tono_bot") || "profesional y amigable").trim(),
  }).eq("id", businessId);

  revalidatePath("/admin/bot");
  redirect("/admin/bot?saved=true");
}

export default async function BotConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: businessUser } = await supabase
    .from("business_users")
    .select("business_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!businessUser?.business_id) redirect("/dashboard");
  if ((businessUser.role || "").toLowerCase() !== "admin") redirect("/dashboard");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slogan, descripcion, servicios, instrucciones_bot, tono_bot, catalogo, catalogo_updated_at")
    .eq("id", businessUser.business_id)
    .maybeSingle();

  if (!business) redirect("/dashboard");

  const resolved = await searchParams;
  const saved = resolved?.saved === "true";

  const b = business as Business;

  const TONOS = [
    "profesional y amigable",
    "formal y serio",
    "casual y cercano",
    "entusiasta y energético",
    "empático y paciente",
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">

        {/* HEADER */}
        <div className="bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/70">Solo Admin</p>
              <h1 className="text-xl font-bold">Configuración del Bot</h1>
            </div>
          </div>
          <p className="text-sm text-white/80 mt-1">
            Define cómo responde el bot, qué servicios ofreces y con qué tono habla con tus clientes.
          </p>
        </div>

        {/* CONFIRMACIÓN */}
        {saved && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-4 rounded-2xl shadow-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="text-sm font-semibold">¡Configuración guardada! El bot ya usa los nuevos datos.</p>
          </div>
        )}

        {/* CATÁLOGO DE PRODUCTOS — fuera del form, se guarda por su cuenta vía cliente */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-1">
            <span className="text-slate-400"><ShoppingBag className="w-4 h-4" /></span>
            Catálogo de productos
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Sube tu catálogo en formato Excel (.xlsx) o CSV. El bot lo usará automáticamente para
            responder preguntas sobre productos, precios y disponibilidad.{' '}
            <a
              href="/prospekto_catalogo_template.xlsx"
              download
              className="text-purple-600 hover:underline font-medium"
            >
              Descargar template
            </a>
          </p>
          <UploadCatalogo
            businessId={b.id}
            updatedAt={b.catalogo_updated_at}
            totalProductos={b.catalogo?.length ?? null}
          />
        </div>

        {/* FORM */}
        <form action={saveConfig} className="space-y-5">
          <input type="hidden" name="businessId" value={b.id} />

          <Section icon={<Sparkles className="w-4 h-4" />} title="Slogan del negocio">
            <p className="text-xs text-slate-500 mb-3">Una frase corta que define tu negocio. El bot la usa para presentarse.</p>
            <input
              name="slogan"
              defaultValue={b.slogan || ""}
              placeholder="Ej: Expertos en marketing digital para empresas que quieren crecer"
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-slate-400"
            />
          </Section>

          <Section icon={<MessageSquare className="w-4 h-4" />} title="Descripción del negocio">
            <p className="text-xs text-slate-500 mb-3">Explica a qué se dedica tu negocio. El bot usará esto para responder preguntas generales.</p>
            <textarea
              name="descripcion"
              defaultValue={b.descripcion || ""}
              rows={4}
              placeholder="Ej: Somos una agencia de marketing digital especializada en redes sociales, publicidad pagada y posicionamiento web para empresas de todos los tamaños en México."
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-slate-400"
            />
          </Section>

          <Section icon={<Package className="w-4 h-4" />} title="Servicios y productos">
            <p className="text-xs text-slate-500 mb-3">
              Descripción general de tus servicios. Si subiste un catálogo Excel arriba, el bot
              combinará ambas fuentes para responder mejor.
            </p>
            <textarea
              name="servicios"
              defaultValue={b.servicios || ""}
              rows={6}
              placeholder={`Ej:\n- Gestión de redes sociales: desde $3,500/mes\n- Publicidad en Meta Ads: desde $2,000/mes\n- Diseño de contenido: desde $1,500/mes`}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-slate-400 font-mono"
            />
          </Section>

          <Section icon={<Settings className="w-4 h-4" />} title="Tono del bot">
            <p className="text-xs text-slate-500 mb-3">Define cómo habla el bot con los clientes.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TONOS.map((tono) => (
                <label key={tono} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-purple-300 hover:bg-purple-50 transition has-checked:border-purple-400 has-checked:bg-purple-50">
                  <input
                    type="radio"
                    name="tono_bot"
                    value={tono}
                    defaultChecked={(b.tono_bot || "profesional y amigable") === tono}
                    className="accent-purple-500"
                  />
                  <span className="text-sm text-slate-700 capitalize">{tono}</span>
                </label>
              ))}
            </div>
          </Section>

          <Section icon={<Bot className="w-4 h-4" />} title="Instrucciones especiales">
            <p className="text-xs text-slate-500 mb-3">
              Reglas específicas para el bot. Por ejemplo: qué no debe decir, cómo manejar objeciones, frases clave, etc.
            </p>
            <textarea
              name="instrucciones_bot"
              defaultValue={b.instrucciones_bot || ""}
              rows={5}
              placeholder={`Ej:\n- Nunca menciones a la competencia\n- Si preguntan por precios, siempre invita a una llamada\n- Si el cliente dice que es urgente, prioriza agendar hoy`}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-slate-400"
            />
          </Section>

          <button
            type="submit"
            className="w-full py-3 bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] hover:opacity-90 text-white font-semibold rounded-xl transition-opacity shadow-lg"
          >
            Guardar configuración
          </button>
        </form>

      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
        <span className="text-slate-400">{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}