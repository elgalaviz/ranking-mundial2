import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type Row = {
  phone: string;
  respuestas: number;
  aciertos: number;
  porcentaje: number;
};

async function getLeaderboard(): Promise<Row[]> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("trivia_historial")
    .select("user_id, acerto, users!inner(phone)");

  if (!data) return [];

  const map: Record<string, { phone: string; respuestas: number; aciertos: number }> = {};
  for (const r of data as Array<{ user_id: string; acerto: boolean; users: { phone: string } }>) {
    if (!map[r.user_id]) map[r.user_id] = { phone: r.users.phone, respuestas: 0, aciertos: 0 };
    map[r.user_id].respuestas++;
    if (r.acerto) map[r.user_id].aciertos++;
  }

  return Object.values(map)
    .map(r => ({ ...r, porcentaje: Math.round((r.aciertos / r.respuestas) * 100) }))
    .sort((a, b) => b.aciertos - a.aciertos || b.porcentaje - a.porcentaje);
}

export default async function TriviaGodPage() {
  const rows = await getLeaderboard();
  const total = rows.length;
  const totalRespuestas = rows.reduce((s, r) => s + r.respuestas, 0);
  const totalAciertos = rows.reduce((s, r) => s + r.aciertos, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ranking Trivia</h1>
        <p className="text-sm text-gray-500 mt-1">
          {total} jugadores · {totalRespuestas} respuestas · {totalAciertos} aciertos
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Teléfono</th>
              <th className="px-4 py-3 text-center">Respondidas</th>
              <th className="px-4 py-3 text-center">Aciertos</th>
              <th className="px-4 py-3 text-center">% Exactitud</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => (
              <tr key={r.phone} className={i === 0 ? "bg-yellow-50" : ""}>
                <td className="px-4 py-3 font-bold text-gray-500">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </td>
                <td className="px-4 py-3 font-mono text-gray-800">+{r.phone}</td>
                <td className="px-4 py-3 text-center text-gray-700">{r.respuestas}</td>
                <td className="px-4 py-3 text-center font-bold text-green-600">{r.aciertos}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    r.porcentaje >= 80 ? "bg-green-100 text-green-700" :
                    r.porcentaje >= 50 ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-600"
                  }`}>
                    {r.porcentaje}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            Nadie ha respondido trivias aún.
          </div>
        )}
      </div>
    </div>
  );
}
