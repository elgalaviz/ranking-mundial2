import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Plus, Building2, Users, MessageCircle, ArrowUpRight, CheckCircle, XCircle } from "lucide-react";

const GOD_EMAIL = "rene.galaviz@gmail.com";

type Business = {
  id: string;
  name: string | null;
  slug: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

function formatDate(d: string | null) {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(d));
  } catch { return "—"; }
}

export default async function GodNegociosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.email !== GOD_EMAIL) redirect("/dashboard");

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: businesses } = await admin
    .from("businesses")
    .select("id, name, slug, is_active, created_at")
    .order("created_at", { ascending: false });

  // Contar leads y usuarios por negocio
  const stats = await Promise.all(
    (businesses || []).map(async (b) => {
      const [{ count: leads }, { count: users }] = await Promise.all([
        admin.from("contactos").select("id", { count: "exact", head: true }).eq("business_id", b.id),
        admin.from("business_users").select("id", { count: "exact", head: true }).eq("business_id", b.id),
      ]);
      return { business_id: b.id, leads: leads ?? 0, users: users ?? 0 };
    })
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">

        {/* HEADER */}
        <div className="bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-white/60">Super Admin</p>
                <h1 className="text-xl font-bold">Negocios</h1>
              </div>
            </div>
            <Link
              href="/god/negocios/nuevo"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-900 font-semibold text-sm rounded-xl hover:bg-indigo-50 transition"
            >
              <Plus className="w-4 h-4" />
              Nuevo negocio
            </Link>
          </div>
          <div className="mt-4 flex gap-6 text-sm text-white/70">
            <span>{businesses?.length || 0} negocios registrados</span>
          </div>
        </div>

        {/* LISTA */}
        <div className="space-y-3">
          {!businesses || businesses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">
              No hay negocios aún. Crea el primero.
            </div>
          ) : (
            (businesses as Business[]).map((b) => {
              const s = stats.find((x) => x.business_id === b.id);
              return (
                <div key={b.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 flex-wrap">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-slate-800">{b.name || "Sin nombre"}</h2>
                      {b.is_active ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Activo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <XCircle className="w-3 h-3" /> Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Creado: {formatDate(b.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-5 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-slate-400" />
                      {s?.leads} leads
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-400" />
                      {s?.users} usuarios
                    </span>
                  </div>
                  <Link
                    href={`/god/negocios/${b.id}`}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition"
                  >
                    Gestionar
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}