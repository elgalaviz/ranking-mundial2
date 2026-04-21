import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { DollarSign, Star, Trophy, TrendingUp } from "lucide-react";

const GOD_EMAIL = process.env.ADMIN_EMAIL || "rene.galaviz@gmail.com";
const PREMIUM_PRICE = 99;
const LIGA_TIERS = [149, 299, 499];

function getSupabaseAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function PagosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.email !== GOD_EMAIL) redirect("/dashboard");

  const db = getSupabaseAdmin();

  const [
    { data: premiumUsers },
    { data: ligasPagadas },
  ] = await Promise.all([
    db.from("users").select("id, name, phone, country_code, created_at").eq("plan", "premium").order("created_at", { ascending: false }),
    db.from("ligas").select("id, nombre, tier, estado, owner_nombre, owner_phone, created_at").gt("tier", 0).order("created_at", { ascending: false }),
  ]);

  const totalPremium = premiumUsers?.length ?? 0;
  const ingresosPremium = totalPremium * PREMIUM_PRICE;

  const ligasActivas = (ligasPagadas ?? []).filter((l) => l.estado === "activa");
  const ingresosLigas = ligasActivas.reduce((sum, l) => sum + (l.tier ?? 0), 0);
  const totalIngresos = ingresosPremium + ingresosLigas;

  const cards = [
    { label: "Ingresos totales", value: `$${totalIngresos.toLocaleString("es-MX")}`, sub: "MXN estimado", icon: DollarSign, color: "bg-green-50 text-green-700 border-green-200" },
    { label: "FanBot Premium", value: totalPremium, sub: `$${ingresosPremium.toLocaleString("es-MX")} MXN`, icon: Star, color: "bg-amber-50 text-amber-700 border-amber-200" },
    { label: "Ligas pagadas", value: ligasActivas.length, sub: `$${ingresosLigas.toLocaleString("es-MX")} MXN`, icon: Trophy, color: "bg-purple-50 text-purple-700 border-purple-200" },
    { label: "Ligas pendientes", value: (ligasPagadas ?? []).filter((l) => l.estado !== "activa").length, sub: "pago no confirmado", icon: TrendingUp, color: "bg-blue-50 text-blue-700 border-blue-200" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Pagos</h1>
        <p className="text-sm text-gray-500 mt-0.5">Resumen de ingresos — Premium y Ligas</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl border p-5 ${c.color}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
                <c.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black">{c.value}</p>
            <p className="text-xs font-medium opacity-70 mt-0.5">{c.label}</p>
            <p className="text-xs opacity-50 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Premium */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Usuarios Premium</h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              $99 c/u
            </span>
          </div>
          {!premiumUsers?.length ? (
            <p className="p-6 text-sm text-gray-400 text-center">Sin usuarios premium</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {premiumUsers.map((u) => (
                <li key={u.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{u.name ?? "Fan"}</p>
                    <p className="text-xs text-gray-400 font-mono">{u.phone}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-md">$99</span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(u.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Ligas pagadas */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Ligas de pago</h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
              {ligasPagadas?.length ?? 0} total
            </span>
          </div>
          {!ligasPagadas?.length ? (
            <p className="p-6 text-sm text-gray-400 text-center">Sin ligas de pago</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {ligasPagadas.map((l) => (
                <li key={l.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{l.nombre}</p>
                    <p className="text-xs text-gray-400 font-mono">{l.owner_phone}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${l.estado === "activa" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      ${l.tier}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(l.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
