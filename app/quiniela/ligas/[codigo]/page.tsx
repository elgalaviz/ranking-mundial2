import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Image from "next/image";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "ranking-mundial-26-secret-key-change-in-production"
);

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("quiniela_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; phone: string };
  } catch { return null; }
}

function maskPhone(phone: string): string {
  return `***${phone.slice(-3)}`;
}

export default async function LigaRankingPage({ params }: { params: Promise<{ codigo: string }> }) {
  const session = await getSession();
  const { codigo } = await params;
  if (!session) redirect(`/quiniela/login?next=/quiniela/ligas/${codigo}`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: liga } = await supabase
    .from("ligas")
    .select("id, nombre, tier, max_participantes, estado, puntos_exacto, puntos_resultado")
    .eq("codigo", codigo.toUpperCase())
    .single();

  if (!liga) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Liga no encontrada.</p>
    </main>
  );

  const { data: miembros } = await supabase
    .from("liga_miembros")
    .select("user_id")
    .eq("liga_id", liga.id);

  const miembroIds = (miembros ?? []).map(m => m.user_id);

  const { data: users } = await supabase
    .from("users")
    .select("id, name, phone")
    .in("id", miembroIds.length > 0 ? miembroIds : ["00000000-0000-0000-0000-000000000000"]);

  const { data: picks } = await supabase
    .from("quiniela_picks")
    .select("user_id, puntos")
    .in("user_id", miembroIds.length > 0 ? miembroIds : ["00000000-0000-0000-0000-000000000000"]);

  const totales: Record<string, number> = {};
  for (const p of picks ?? []) {
    totales[p.user_id] = (totales[p.user_id] ?? 0) + (p.puntos ?? 0);
  }

  const posiciones = (users ?? [])
    .map(u => ({ ...u, puntos: totales[u.id] ?? 0 }))
    .sort((a, b) => b.puntos - a.puntos);

  const esMiembro = miembroIds.includes(session.userId);

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/"><Image src="/mifanbot-h.svg" alt="MiFanBot" width={130} height={34} priority /></Link>
          <Link href="/quiniela" className="text-sm text-[#006847] font-medium hover:underline">← Mis pronósticos</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{liga.nombre}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {posiciones.length} / {liga.max_participantes} participantes ·
            <span className={`ml-1 font-medium ${liga.estado === "activa" ? "text-green-600" : "text-amber-500"}`}>
              {liga.estado === "activa" ? "Activa" : "Pendiente"}
            </span>
          </p>
        </div>

        {!esMiembro && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            No eres miembro de esta liga. Pide al organizador que te comparta el enlace de invitación.
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-10">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Participante</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {posiciones.map((p, i) => {
                const esMio = p.id === session.userId;
                const pos = i + 1;
                return (
                  <tr key={p.id} className={`border-b border-gray-100 last:border-0 ${esMio ? "bg-red-50" : "hover:bg-gray-50"}`}>
                    <td className="px-4 py-3 font-bold text-sm">
                      {pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : <span className="text-gray-400">{pos}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${esMio ? "text-red-700" : "text-gray-800"}`}>
                          {maskPhone(p.phone ?? "")}
                        </span>
                        {esMio && <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">Tú</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold text-base ${esMio ? "text-red-700" : "text-gray-900"}`}>{p.puntos}</span>
                      <span className="text-xs text-gray-400 ml-1">pts</span>
                    </td>
                  </tr>
                );
              })}
              {posiciones.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Aún no hay participantes.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-center text-gray-400">
          {liga.puntos_exacto} pts marcador exacto · {liga.puntos_resultado} pts resultado correcto
        </p>
      </div>
    </main>
  );
}
