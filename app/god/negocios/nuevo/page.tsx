import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";

const GOD_EMAIL = "rene.galaviz@gmail.com";

async function createNegocio(formData: FormData) {
  "use server";

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim().toLowerCase().replace(/\s+/g, "-");
  const adminEmail = String(formData.get("admin_email") || "").trim();
  const adminPassword = String(formData.get("admin_password") || "").trim();
  const phoneNumberId = String(formData.get("phone_number_id") || "").trim();
  const accessToken = String(formData.get("access_token") || "").trim();
  const displayPhone = String(formData.get("display_phone") || "").trim();

  if (!name || !slug || !adminEmail || !adminPassword) return;

  // 1. Crear negocio
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .insert({ name, slug, is_active: true })
    .select()
    .maybeSingle();

  if (bizError || !business) return;

  // 2. Crear usuario admin en Supabase Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  });

  if (authError || !authUser?.user) return;

  // 3. Agregar a business_users como admin
  await supabase.from("business_users").insert({
    business_id: business.id,
    user_id: authUser.user.id,
    role: "admin",
    email: adminEmail,
  });

  // 4. Crear whatsapp_account si se proporcionó
  if (phoneNumberId && accessToken) {
    await supabase.from("whatsapp_accounts").insert({
      business_id: business.id,
      phone_number_id: phoneNumberId,
      access_token: accessToken,
      display_phone: displayPhone,
      is_active: true,
    });
  }

  revalidatePath("/god/negocios");
  redirect("/god/negocios");
}

export default async function NuevoNegocioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.email !== GOD_EMAIL) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">

        <Link href="/god/negocios" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition font-medium">
          <ArrowLeft className="w-4 h-4" />
          Volver a negocios
        </Link>

        {/* HEADER */}
        <div className="bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60">Super Admin</p>
              <h1 className="text-xl font-bold">Nuevo negocio</h1>
            </div>
          </div>
        </div>

        {/* FORM */}
        <form action={createNegocio} className="space-y-5">

          {/* Info del negocio */}
          <Section title="Información del negocio">
            <Field label="Nombre del negocio" required>
              <input name="name" required placeholder="Ej: Ranking Agency" className={inputClass} />
            </Field>
            <Field label="Slug (URL)" required>
              <input name="slug" required placeholder="Ej: ranking-agency" className={inputClass} />
              <p className="text-xs text-slate-400 mt-1">Solo minúsculas, sin espacios. Se usa como identificador.</p>
            </Field>
          </Section>

          {/* Admin del negocio */}
          <Section title="Usuario administrador">
            <Field label="Email del admin" required>
              <input name="admin_email" type="email" required placeholder="admin@negocio.com" className={inputClass} />
            </Field>
            <Field label="Contraseña temporal" required>
              <input name="admin_password" type="text" required placeholder="Mínimo 6 caracteres" className={inputClass} />
              <p className="text-xs text-slate-400 mt-1">El admin podrá cambiarla después desde Supabase.</p>
            </Field>
          </Section>

          {/* WhatsApp */}
          <Section title="Cuenta de WhatsApp (opcional)">
            <p className="text-xs text-slate-500 mb-4">Puedes configurarlo después desde Supabase si no lo tienes aún.</p>
            <Field label="Phone Number ID">
              <input name="phone_number_id" placeholder="Ej: 1014747251727193" className={inputClass} />
            </Field>
            <Field label="Número visible">
              <input name="display_phone" placeholder="Ej: 8181817006" className={inputClass} />
            </Field>
            <Field label="Access Token de Meta">
              <input name="access_token" placeholder="EAA..." className={inputClass} />
            </Field>
          </Section>

          <button
            type="submit"
            className="w-full py-3 bg-[linear-gradient(135deg,#1e1b4b_0%,#312e81_100%)] hover:opacity-90 text-white font-semibold rounded-xl transition-opacity shadow-lg"
          >
            Crear negocio
          </button>
        </form>
      </div>
    </div>
  );
}

const inputClass = "w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-400 bg-white";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
    </div>
  );
}