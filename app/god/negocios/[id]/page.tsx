import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, Building2, Users, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";

const GOD_EMAIL = "rene.galaviz@gmail.com";

async function toggleActive(formData: FormData) {
  "use server";
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const id = String(formData.get("id") || "");
  const current = formData.get("is_active") === "true";
  await supabase.from("businesses").update({ is_active: !current }).eq("id", id);
  revalidatePath(`/god/negocios/${id}`);
}

async function addSeller(formData: FormData) {
  "use server";
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const businessId = String(formData.get("businessId") || "");
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const role = String(formData.get("role") || "seller");
  if (!email || !password) return;

  const { data: authUser } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (!authUser?.user) return;

  await supabase.from("business_users").insert({
    business_id: businessId,
    user_id: authUser.user.id,
    role,
    email,
  });
  revalidatePath(`/god/negocios/${businessId}`);
}

async function removeUser(formData: FormData) {
  "use server";
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const businessUserId = String(formData.get("businessUserId") || "");
  const businessId = String(formData.get("businessId") || "");
  await supabase.from("business_users").delete().eq("id", businessUserId);
  revalidatePath(`/god/negocios/${businessId}`);
}

export default async function GodNegocioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.email !== GOD_EMAIL) redirect("/dashboard");

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: business } = await admin.from("businesses").select("*").eq("id", id).maybeSingle();
  if (!business) redirect("/god/negocios");

  const { data: users } = await admin.from("business_users").select("*").eq("business_id", id).order("role");
  const { data: waAccounts } = await admin.from("whatsapp_accounts").select("*").eq("business_id", id);
  const { count: leadsCount } = await admin.from("contactos").select("id", { count: "exact", head: true }).eq("business_id", id);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-5">

        <Link href="/god/negocios" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition font-medium">
          <ArrowLeft className="w-4 h-4" />
          Volver a negocios
        </Link>

        {/* HEADER */}
        <div className="bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-white/60">Super Admin</p>
                <h1 className="text-xl text-white font-bold">{business.name}</h1>
              </div>
            </div>
            <form action={toggleActive}>
              <input type="hidden" name="id" value={business.id} />
              <input type="hidden" name="is_active" value={String(business.is_active)} />
              <button type="submit" className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${business.is_active ? "bg-rose-500 hover:bg-rose-600 text-white" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}>
                {business.is_active ? <><XCircle className="w-4 h-4" /> Desactivar</> : <><CheckCircle className="w-4 h-4" /> Activar</>}
              </button>
            </form>
          </div>
          <div className="flex gap-6 mt-4 pt-4 border-t border-white/10 text-sm text-white/70">
            <span>{leadsCount} leads</span>
            <span>{users?.length || 0} usuarios</span>
            <span>{waAccounts?.length || 0} números WhatsApp</span>
          </div>
        </div>

        {/* USUARIOS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-slate-400" />
            Usuarios del negocio
          </h2>

          <div className="space-y-2 mb-5">
            {!users || users.length === 0 ? (
              <p className="text-sm text-slate-400">Sin usuarios aún.</p>
            ) : (
              users.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{u.email || "Sin email"}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600"}`}>
                      {u.role}
                    </span>
                  </div>
                  <form action={removeUser}>
                    <input type="hidden" name="businessUserId" value={u.id} />
                    <input type="hidden" name="businessId" value={id} />
                    <button type="submit" className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>

          {/* Agregar usuario */}
          <form action={addSeller} className="border-t border-slate-100 pt-4 space-y-3">
            <input type="hidden" name="businessId" value={id} />
            <p className="text-sm font-medium text-slate-700">Agregar usuario</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input name="email" type="email" required placeholder="email@negocio.com" className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-400" />
              <input name="password" type="text" required placeholder="Contraseña temporal" className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-400" />
            </div>
            <select name="role" className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 w-full">
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition">
              <Plus className="w-4 h-4" />
              Agregar usuario
            </button>
          </form>
        </div>

        {/* WHATSAPP ACCOUNTS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Números de WhatsApp</h2>
          {!waAccounts || waAccounts.length === 0 ? (
            <p className="text-sm text-slate-400">Sin números configurados.</p>
          ) : (
            <div className="space-y-2">
              {waAccounts.map((wa: any) => (
                <div key={wa.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-sm font-medium text-slate-800">+{wa.display_phone}</p>
                  <p className="text-xs text-slate-400 mt-0.5">ID: {wa.phone_number_id}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${wa.is_active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {wa.is_active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}