import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { Users, Globe, Hash, Calendar, MessageCircle, Bell, Target } from "lucide-react";
import { Suspense } from "react";
import Link from "next/link";
import UsersFilters from "./UsersFilters";

function getSupabaseAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const GOD_EMAIL = process.env.ADMIN_EMAIL || "rene.galaviz@gmail.com";

type FanBotUser = {
  id: string;
  whatsapp_id: string;
  created_at: string;
  name: string | null;
  phone: string | null;
  country_code: string | null;
  consultas_hoy: number;
  consultas_reset: string | null;
  plan: string | null;
  alertas_activas: boolean | null;
  pronosticos_total: number;
  pronosticos_acertados: number;
  rank: number;
};

const RANK_STYLES: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "bg-emerald-500", text: "text-white", label: "1" },
  2: { bg: "bg-blue-500",    text: "text-white", label: "2" },
  3: { bg: "bg-amber-400",   text: "text-white", label: "3" },
  4: { bg: "bg-orange-400",  text: "text-white", label: "4" },
  5: { bg: "bg-gray-300",    text: "text-gray-700", label: "5" },
};

function formatDate(d: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("es-MX", {
      timeZone: "America/Mexico_City",
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
}

function scoreUser(u: Omit<FanBotUser, "rank">) {
  return (u.pronosticos_total * 3) + (u.pronosticos_acertados * 2) + u.consultas_hoy + (u.alertas_activas ? 2 : 0);
}

export default async function GodUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; country?: string; q?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.email !== GOD_EMAIL) redirect("/dashboard");

  const { plan, country, q } = await searchParams;
  const db = getSupabaseAdmin();
  const today = new Date().toISOString().split("T")[0];

  let query = db
    .from("users")
    .select("id, whatsapp_id, created_at, name, phone, country_code, consultas_hoy, consultas_reset, plan, alertas_activas")
    .order("created_at", { ascending: false });

  if (plan) query = query.eq("plan", plan);
  if (country) query = query.eq("country_code", country);
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);

  const [{ data: rawUsers }, { data: allUsers }, { data: pronos }] = await Promise.all([
    query,
    db.from("users").select("country_code"),
    db.from("pronosticos").select("whatsapp_id, acerto"),
  ]);

  // Agrupar pronósticos por whatsapp_id
  const pronoMap: Record<string, { total: number; acertados: number }> = {};
  for (const p of pronos || []) {
    if (!pronoMap[p.whatsapp_id]) pronoMap[p.whatsapp_id] = { total: 0, acertados: 0 };
    pronoMap[p.whatsapp_id].total++;
    if (p.acerto === true) pronoMap[p.whatsapp_id].acertados++;
  }

  // Enriquecer usuarios con datos de pronósticos
  const enriched = (rawUsers || []).map(u => ({
    ...u,
    pronosticos_total: pronoMap[u.whatsapp_id]?.total ?? 0,
    pronosticos_acertados: pronoMap[u.whatsapp_id]?.acertados ?? 0,
    rank: 0,
  })) as Omit<FanBotUser, "rank">[];

  // Calcular ranking 1-5 por quintiles de score
  const scores = enriched.map(scoreUser).sort((a, b) => b - a);
  const n = scores.length;
  const users: FanBotUser[] = enriched.map(u => {
    const score = scoreUser(u);
    const percentile = n > 1 ? scores.indexOf(score) / (n - 1) : 0;
    const rank = percentile < 0.2 ? 1 : percentile < 0.4 ? 2 : percentile < 0.6 ? 3 : percentile < 0.8 ? 4 : 5;
    return { ...u, rank };
  });

  const usersByCountry = (allUsers || []).reduce((acc, u) => {
    const c = u.country_code || "XX";
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedCountries = Object.entries(usersByCountry).sort((a, b) => b[1] - a[1]);
  const totalUsers = users.length;
  const isFiltered = !!(plan || country || q);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Usuarios</h1>
            <p className="text-sm text-gray-500">
              {totalUsers} {isFiltered ? "encontrados" : "inscritos en total"}
            </p>
          </div>
        </div>
      </div>

      <Suspense>
        <UsersFilters countries={sortedCountries} />
      </Suspense>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-medium">Nombre</th>
              <th className="px-6 py-3 font-medium"><Globe className="w-4 h-4 inline -mt-0.5 mr-1" />País</th>
              <th className="px-6 py-3 font-medium"><Hash className="w-4 h-4 inline -mt-0.5 mr-1" />Número</th>
              <th className="px-6 py-3 font-medium"><Calendar className="w-4 h-4 inline -mt-0.5 mr-1" />Registro</th>
              <th className="px-6 py-3 font-medium"><MessageCircle className="w-4 h-4 inline -mt-0.5 mr-1" />Consultas</th>
              <th className="px-6 py-3 font-medium"><Target className="w-4 h-4 inline -mt-0.5 mr-1" />Pronós.</th>
              <th className="px-6 py-3 font-medium"><Bell className="w-4 h-4 inline -mt-0.5 mr-1" />Alertas</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const rs = RANK_STYLES[u.rank];
              return (
                <tr key={u.id} className="border-b border-gray-200 bg-white hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4">
                    <Link href={`/god/users/${u.id}`} className="flex items-center gap-2 font-semibold text-gray-800 hover:text-blue-600">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-black ${rs.bg} ${rs.text}`}>
                        {rs.label}
                      </span>
                      {u.name || "Fan"}
                      {u.plan === "premium" && (
                        <span className="text-xs bg-amber-200 text-amber-800 font-bold px-1.5 py-0.5 rounded">PRO</span>
                      )}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-md">
                      {u.country_code || "XX"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono">{u.phone ? `+${u.phone.slice(0, 3)} ****${u.phone.slice(-4)}` : "—"}</td>
                  <td className="px-6 py-4">{formatDate(u.created_at)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="font-semibold text-gray-800">{u.consultas_hoy}</div>
                    {u.consultas_reset && (
                      <div className={`text-xs mt-0.5 ${u.consultas_reset === today ? "text-green-600 font-medium" : "text-gray-400"}`}>
                        {u.consultas_reset === today ? "hoy" : u.consultas_reset}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {u.pronosticos_total > 0 ? (
                      <div>
                        <div className="font-semibold text-gray-800">{u.pronosticos_total}</div>
                        {u.pronosticos_acertados > 0 && (
                          <div className="text-xs text-green-600 font-medium mt-0.5">{u.pronosticos_acertados} ✓</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {u.alertas_activas === true
                      ? <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-xs"><Bell className="w-3.5 h-3.5" />Sí</span>
                      : u.alertas_activas === false
                      ? <span className="text-gray-300 text-xs">No</span>
                      : <span className="text-gray-200 text-xs">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {totalUsers === 0 && (
          <p className="p-8 text-center text-gray-400">
            {isFiltered ? "No hay usuarios que coincidan con los filtros." : "Aún no hay usuarios registrados."}
          </p>
        )}
      </div>
    </div>
  );
}
