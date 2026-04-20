import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Users, Globe, Hash, Calendar, MessageCircle, Filter } from "lucide-react";

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
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default async function GodUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.email !== GOD_EMAIL) redirect("/dashboard");

  const { data: users, error } = await supabase
    .from("users")
    .select("id, created_at, name, phone, country_code, consultas_hoy, plan")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
  }

  const totalUsers = users?.length ?? 0;
  const usersByCountry = (users || []).reduce((acc, u) => {
    const country = u.country_code || "XX";
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedCountries = Object.entries(usersByCountry).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
        {/* HEADER */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Usuarios</h1>
                <p className="text-sm text-gray-500">{totalUsers} inscritos en total</p>
              </div>
            </div>
          </div>
        </div>

        {/* FILTROS */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-gray-600 flex items-center gap-2"><Filter className="w-4 h-4" />Filtros:</span>
            <select className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
              <option value="">Todos los Planes</option>
              <option value="free">Free</option>
              <option value="premium">PRO</option>
            </select>
            <select className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
              <option value="">Todos los Países</option>
              {sortedCountries.map(([country, count]) => (
                <option key={country} value={country}>{country} ({count})</option>
              ))}
            </select>
            <input type="text" placeholder="Filtrar por ciudad..." className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
            <select className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
              <option value="">Quiniela</option>
              <option value="yes">Participa</option>
              <option value="no">No participa</option>
            </select>
             <select className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
              <option value="">Fantasy</option>
              <option value="yes">Participa</option>
              <option value="no">No participa</option>
            </select>
          </div>
        </div>

        {/* LISTA */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Nombre</th>
                <th scope="col" className="px-6 py-3 font-medium"><Globe className="w-4 h-4 inline -mt-0.5 mr-1" />País</th>
                <th scope="col" className="px-6 py-3 font-medium"><Hash className="w-4 h-4 inline -mt-0.5 mr-1" />Número</th>
                <th scope="col" className="px-6 py-3 font-medium"><Calendar className="w-4 h-4 inline -mt-0.5 mr-1" />Fecha Registro</th>
                <th scope="col" className="px-6 py-3 font-medium"><MessageCircle className="w-4 h-4 inline -mt-0.5 mr-1" />Consultas Hoy</th>
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
          {totalUsers === 0 && <p className="p-8 text-center text-gray-400">Aún no hay usuarios registrados.</p>}
        </div>
    </div>
  );
}
