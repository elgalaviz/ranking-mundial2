import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { ArrowLeft, Bell, MessageCircle, Target, CheckCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";

function getSupabaseAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const GOD_EMAIL = process.env.ADMIN_EMAIL!;

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDateShort(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");
  if (authUser.email !== GOD_EMAIL) redirect("/dashboard");

  const db = getSupabaseAdmin();

  const { data: u } = await db.from("users")
    .select("id, whatsapp_id, name, phone, country_code, created_at, consultas_hoy, consultas_reset, alertas_activas, plan")
    .eq("id", id)
    .single();

  if (!u) redirect("/god/users");

  const { data: pronos } = await db.from("pronosticos")
    .select("id, equipo_local, equipo_visitante, pronostico, acerto, momio, created_at, fecha_partido")
    .eq("whatsapp_id", u.whatsapp_id)
    .order("created_at", { ascending: false });

  const userPronos = pronos || [];
  const total = userPronos.length;
  const acertados = userPronos.filter(p => p.acerto === true).length;
  const fallados = userPronos.filter(p => p.acerto === false).length;
  const pendientes = userPronos.filter(p => p.acerto === null).length;
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link href="/god/users" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver a usuarios
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{u.name || "Fan"}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {u.phone ? `+${u.phone.slice(0, 3)} ****${u.phone.slice(-4)}` : "—"}
              {u.country_code && <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded">{u.country_code}</span>}
            </p>
            <p className="text-gray-400 text-xs mt-2">Registrado: {formatDate(u.created_at)}</p>
          </div>
          {u.plan === "premium" && (
            <span className="bg-amber-200 text-amber-800 font-bold text-xs px-2 py-1 rounded">PRO</span>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center">
          <MessageCircle className="w-5 h-5 text-gray-400 mx-auto mb-2" />
          <div className="text-2xl font-black text-gray-900">{u.consultas_hoy}</div>
          <div className="text-xs text-gray-400 mt-1">Consultas hoy</div>
          {u.consultas_reset && (
            <div className={`text-xs mt-1 font-medium ${u.consultas_reset === today ? "text-green-600" : "text-gray-300"}`}>
              {u.consultas_reset === today ? "activo hoy" : u.consultas_reset}
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center">
          <Target className="w-5 h-5 text-gray-400 mx-auto mb-2" />
          <div className="text-2xl font-black text-gray-900">{total}</div>
          <div className="text-xs text-gray-400 mt-1">Pronósticos</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center">
          <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-black text-green-600">{acertados}</div>
          <div className="text-xs text-gray-400 mt-1">Acertados</div>
          {total > 0 && <div className="text-xs text-green-500 mt-1">{Math.round(acertados / total * 100)}%</div>}
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center">
          <Bell className="w-5 h-5 mx-auto mb-2" style={{ color: u.alertas_activas ? "#16a34a" : "#d1d5db" }} />
          <div className={`text-2xl font-black ${u.alertas_activas ? "text-green-600" : "text-gray-300"}`}>
            {u.alertas_activas === true ? "Sí" : u.alertas_activas === false ? "No" : "—"}
          </div>
          <div className="text-xs text-gray-400 mt-1">Alertas</div>
        </div>
      </div>

      {/* Pronósticos */}
      {total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Pronósticos</h2>
            <div className="flex gap-3 text-xs text-gray-500">
              <span className="text-green-600 font-medium">{acertados} ✓</span>
              <span className="text-red-400 font-medium">{fallados} ✗</span>
              <span className="text-gray-400">{pendientes} pendientes</span>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-400 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-2 font-medium text-left">Partido</th>
                <th className="px-6 py-2 font-medium text-left">Pick</th>
                <th className="px-6 py-2 font-medium text-center">Resultado</th>
                <th className="px-6 py-2 font-medium text-right">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {userPronos.map(p => {
                const pick = p.pronostico === "local" ? p.equipo_local : p.pronostico === "visitante" ? p.equipo_visitante : "Empate";
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-700">
                      <div className="font-medium">{p.equipo_local} vs {p.equipo_visitante}</div>
                    </td>
                    <td className="px-6 py-3 text-gray-600 font-medium">{pick}</td>
                    <td className="px-6 py-3 text-center">
                      {p.acerto === true
                        ? <CheckCircle className="w-4 h-4 text-green-500 inline" />
                        : p.acerto === false
                        ? <XCircle className="w-4 h-4 text-red-400 inline" />
                        : <Clock className="w-4 h-4 text-gray-300 inline" />}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-400 text-xs">{formatDateShort(p.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {total === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center text-gray-400">
          Este usuario aún no ha hecho ningún pronóstico.
        </div>
      )}
    </div>
  );
}
