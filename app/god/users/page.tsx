import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Users, Globe, Hash, Calendar, MessageCircle } from "lucide-react";
import { Suspense } from "react";
import UsersFilters from "./UsersFilters";

const GOD_EMAIL = process.env.ADMIN_EMAIL || "rene.galaviz@gmail.com";

type FanBotUser = {
  id: string;
  created_at: string;
  name: string | null;
  phone: string | null;
  country_code: string | null;
  consultas_hoy: number;
  plan: string | null;
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

  let query = supabase
    .from("users")
    .select("id, created_at, name, phone, country_code, consultas_hoy, plan")
    .order("created_at", { ascending: false });

  if (plan) query = query.eq("plan", plan);
  if (country) query = query.eq("country_code", country);
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);

  const { data: users } = await query;

  // Para los contadores del selector de países siempre traemos todos
  const { data: allUsers } = await supabase
    .from("users")
    .select("country_code");

  const usersByCountry = (allUsers || []).reduce((acc, u) => {
    const c = u.country_code || "XX";
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedCountries = Object.entries(usersByCountry).sort((a, b) => b[1] - a[1]);
  const totalUsers = users?.length ?? 0;
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
              <th className="px-6 py-3 font-medium"><Calendar className="w-4 h-4 inline -mt-0.5 mr-1" />Fecha Registro</th>
              <th className="px-6 py-3 font-medium"><MessageCircle className="w-4 h-4 inline -mt-0.5 mr-1" />Consultas Hoy</th>
            </tr>
          </thead>
          <tbody>
            {(users as FanBotUser[] || []).map((u) => (
              <tr key={u.id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold text-gray-800">{u.name || "Fan"}</td>
                <td className="px-6 py-4">
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-md">
                    {u.country_code || "XX"}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono">{u.phone}</td>
                <td className="px-6 py-4">{formatDate(u.created_at)}</td>
                <td className="px-6 py-4 text-center">{u.consultas_hoy}</td>
              </tr>
            ))}
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
