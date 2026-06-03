import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Grupos Mundial 2026",
  description: "Tabla de posiciones en tiempo real de los grupos del Mundial 2026.",
};

export const revalidate = 300; // refresca cada 5 min

const WA_NUMBER = "5218112993097";

type Standing = {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  group: string;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
};

async function getStandings(): Promise<Record<string, Standing[]>> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return {};
  try {
    const res = await fetch("https://v3.football.api-sports.io/standings?league=1&season=2026", {
      headers: { "x-apisports-key": key },
      next: { revalidate: 300 },
    });
    const json = await res.json();
    const groups: Standing[][] = json.response?.[0]?.league?.standings || [];
    return groups
      .filter(g => g[0]?.group?.startsWith("Group"))
      .reduce((acc, group) => {
        const name = group[0]?.group || "Grupo";
        acc[name] = group;
        return acc;
      }, {} as Record<string, Standing[]>);
  } catch {
    return {};
  }
}

export default async function GruposPage() {
  const grupos = await getStandings();
  const grupoKeys = Object.keys(grupos).sort();

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-black shadow-md">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <Link href="/">
            <img src="/mifanbot-h.svg" alt="MiFanBot" width={140} height={36} />
          </Link>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=Hola%20FanBot%2C%20quiero%20mis%20alertas%20del%20Mundial%202026`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm border border-white text-white px-4 py-2 rounded-full hover:bg-white hover:text-black transition-all font-medium"
          >
            Unirme gratis
          </a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase text-gray-900">Grupos</h1>
          <p className="text-gray-500 mt-1">Mundial 2026 · Tabla de posiciones</p>
        </div>

        {grupoKeys.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p>Los grupos aún no tienen partidos jugados.</p>
            <p className="text-sm mt-1">Vuelve el 11 de junio cuando empiece el torneo.</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {grupoKeys.map(grupoName => (
            <div key={grupoName} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-black text-white">
                <h2 className="font-black uppercase text-sm tracking-widest">{grupoName}</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase text-gray-400 border-b border-gray-100">
                    <th className="px-3 py-2 text-left font-medium w-6">#</th>
                    <th className="px-3 py-2 text-left font-medium">Equipo</th>
                    <th className="px-3 py-2 text-center font-medium">PJ</th>
                    <th className="px-3 py-2 text-center font-medium">G</th>
                    <th className="px-3 py-2 text-center font-medium">E</th>
                    <th className="px-3 py-2 text-center font-medium">P</th>
                    <th className="px-3 py-2 text-center font-medium">DG</th>
                    <th className="px-3 py-2 text-center font-bold text-gray-900">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {grupos[grupoName].map((s, i) => (
                    <tr key={s.team.id} className={`border-b border-gray-50 last:border-0 ${i < 2 ? "bg-green-50/50" : ""}`}>
                      <td className="px-3 py-2.5 text-gray-400 text-xs">{s.rank}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <img src={s.team.logo} alt={s.team.name} width={18} height={18} className="object-contain" />
                          <span className="font-medium text-gray-800 text-xs truncate max-w-[90px]">{s.team.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center text-gray-500 text-xs">{s.all.played}</td>
                      <td className="px-3 py-2.5 text-center text-gray-500 text-xs">{s.all.win}</td>
                      <td className="px-3 py-2.5 text-center text-gray-500 text-xs">{s.all.draw}</td>
                      <td className="px-3 py-2.5 text-center text-gray-500 text-xs">{s.all.lose}</td>
                      <td className="px-3 py-2.5 text-center text-gray-500 text-xs">
                        {s.goalsDiff > 0 ? `+${s.goalsDiff}` : s.goalsDiff}
                      </td>
                      <td className="px-3 py-2.5 text-center font-black text-gray-900">{s.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-300 mt-8">
          Se actualiza cada 5 minutos · <Link href="/" className="hover:text-gray-500">MiFanBot</Link>
        </p>
      </div>
    </main>
  );
}
