import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { Users, Star, Trophy, Swords } from "lucide-react";

const GOD_EMAIL = process.env.ADMIN_EMAIL || "rene.galaviz@gmail.com";

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

export default async function GodDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.email !== GOD_EMAIL) redirect("/dashboard");

  const db = getSupabaseAdmin();

  const [
    { data: allUsers },
    { data: quinielaUsers },
    { data: fantasyUsers },
  ] = await Promise.all([
    db.from("users").select("id, name, phone, country_code, plan, created_at").order("created_at", { ascending: false }),
    db.from("quiniela_picks").select("user_id").limit(1000),
    db.from("users").select("id").eq("plan", "fantasy"),
  ]);

  const users = allUsers ?? [];
  const totalUsuarios = users.length;
  const totalPremium = users.filter((u) => u.plan === "premium").length;
  const totalFree = users.filter((u) => !u.plan || u.plan === "free").length;

  const quinielaIds = new Set((quinielaUsers ?? []).map((q) => q.user_id));
  const totalQuiniela = users.filter((u) => quinielaIds.has(u.id)).length;
  const totalFantasy = fantasyUsers?.length ?? 0;

  const ultimosFree = users.filter((u) => !u.plan || u.plan === "free").slice(0, 10);
  const ultimosPremium = users.filter((u) => u.plan === "premium").slice(0, 10);

  const cards = [
    { label: "Usuarios totales", value: totalUsuarios, icon: Users, color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "Premium", value: totalPremium, icon: Star, color: "bg-amber-50 text-amber-700 border-amber-200" },
    { label: "En Quiniela", value: totalQuiniela, icon: Trophy, color: "bg-green-50 text-green-700 border-green-200" },
    { label: "Fantasy", value: totalFantasy, icon: Swords, color: "bg-purple-50 text-purple-700 border-purple-200" },
  ];

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl border p-5 flex items-center gap-4 ${c.color}`}>
            <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
              <c.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-3xl font-black">{c.value}</p>
              <p className="text-xs font-medium opacity-70">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserList title="Últimos 10 Free" users={ultimosFree} badge="free" />
        <UserList title="Últimos 10 Premium" users={ultimosPremium} badge="premium" />
      </div>
    </div>
  );
}

function UserList({
  title,
  users,
  badge,
}: {
  title: string;
  users: { id: string; name: string | null; phone: string | null; country_code: string | null; created_at: string }[];
  badge: "free" | "premium";
}) {
  const badgeStyle = badge === "premium"
    ? "bg-amber-100 text-amber-700"
    : "bg-gray-100 text-gray-500";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">{title}</h2>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeStyle}`}>
          {badge}
        </span>
      </div>
      {users.length === 0 ? (
        <p className="p-6 text-sm text-gray-400 text-center">Sin usuarios</p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {users.map((u) => (
            <li key={u.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">{u.name ?? "Fan"}</p>
                <p className="text-xs text-gray-400 font-mono">{u.phone}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-md">
                  {u.country_code ?? "XX"}
                </span>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(u.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
