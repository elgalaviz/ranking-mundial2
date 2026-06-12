import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

const API_KEY = process.env.API_FOOTBALL_KEY || "";
const API_BASE = "https://v3.football.api-sports.io";
const WA_NUMBER = "5218112993097";

const POSICION_ES: Record<string, string> = {
  Goalkeeper: "Portero",
  Defender: "Defensa",
  Midfielder: "Mediocampista",
  Attacker: "Delantero",
};

const POSICION_COLOR: Record<string, string> = {
  Goalkeeper: "#f59e0b",
  Defender: "#3b82f6",
  Midfielder: "#10b981",
  Attacker: "#ef4444",
};

type JugadorDB = {
  id: number;
  nombre: string;
  posicion: string | null;
  numero: number | null;
  edad: number | null;
  foto_url: string | null;
  foto_custom_url: string | null;
  destacado: boolean | null;
  team_id: number;
};

type Seleccion = {
  id: number;
  nombre: string;
  logo_url: string | null;
  grupo: string | null;
};

type ApiStats = {
  player: {
    name: string;
    nationality: string | null;
    height: string | null;
    weight: string | null;
    birth: { date: string | null; place: string | null; country: string | null };
    photo: string | null;
  };
  statistics: Array<{
    league: { id: number; season: number };
    games: {
      appearences: number | null;
      lineups: number | null;
      minutes: number | null;
      rating: string | null;
      captain: boolean;
    };
    goals: { total: number | null; assists: number | null; saves: number | null; conceded: number | null };
    cards: { yellow: number; yellowred: number; red: number };
    shots: { total: number | null; on: number | null };
    passes: { total: number | null; key: number | null; accuracy: number | null };
    dribbles: { attempts: number | null; success: number | null };
    tackles: { total: number | null; blocks: number | null; interceptions: number | null };
    fouls: { drawn: number | null; committed: number | null };
  }>;
};

async function getJugadorDB(playerId: number): Promise<{ jugador: JugadorDB | null; seleccion: Seleccion | null }> {
  const supabase = await createClient();
  const { data: jugador } = await supabase
    .from("jugadores")
    .select("*")
    .eq("id", playerId)
    .single();

  if (!jugador) return { jugador: null, seleccion: null };

  const { data: seleccion } = await supabase
    .from("selecciones")
    .select("id, nombre, logo_url, grupo")
    .eq("id", jugador.team_id)
    .single();

  return { jugador: jugador as JugadorDB, seleccion: seleccion as Seleccion | null };
}

async function getApiStats(playerId: number): Promise<ApiStats | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch(
      `${API_BASE}/players?id=${playerId}&season=2026&league=1`,
      {
        headers: { "x-apisports-key": API_KEY },
        next: { revalidate: 1800 },
      }
    );
    const json = await res.json();
    return json.response?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ player_id: string }> }): Promise<Metadata> {
  const { player_id } = await params;
  const { jugador } = await getJugadorDB(Number(player_id));
  return {
    title: jugador ? `${jugador.nombre} — Mundial 2026` : "Jugador",
    description: jugador ? `Estadísticas de ${jugador.nombre} en el Mundial 2026.` : "",
  };
}

export default async function JugadorPage({ params }: { params: Promise<{ player_id: string }> }) {
  const { player_id } = await params;
  const playerId = Number(player_id);
  if (isNaN(playerId)) notFound();

  const [{ jugador, seleccion }, apiData] = await Promise.all([
    getJugadorDB(playerId),
    getApiStats(playerId),
  ]);

  if (!jugador) notFound();

  const foto = jugador.foto_custom_url || jugador.foto_url || apiData?.player?.photo || null;
  const posColor = POSICION_COLOR[jugador.posicion || ""] || "#6b7280";
  const posLabel = POSICION_ES[jugador.posicion || ""] || jugador.posicion || "";

  // Buscar stats del Mundial 2026 (league=1)
  const wc = apiData?.statistics?.find(s => s.league.id === 1 && s.league.season === 2026);
  const hasStats = wc && (wc.games.appearences ?? 0) > 0;

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="bg-black shadow-md">
        <div className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
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

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Breadcrumb */}
        {seleccion && (
          <Link href={`/selecciones/${seleccion.id}`} className="text-sm text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1.5">
            ← {seleccion.nombre}
          </Link>
        )}

        {/* Hero card */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            {/* Foto */}
            <div className="w-full sm:w-48 h-56 sm:h-auto bg-gray-100 relative shrink-0 flex items-end justify-center overflow-hidden">
              {foto ? (
                <img src={foto} alt={jugador.nombre} className="w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl text-gray-300">👤</div>
              )}
              {jugador.destacado && (
                <div className="absolute top-3 right-3 text-yellow-400 text-xl drop-shadow">★</div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 p-6 flex flex-col justify-between gap-4">
              <div>
                {/* Nombre + equipo */}
                <div className="flex items-center gap-3 mb-1">
                  {seleccion?.logo_url && (
                    <img src={seleccion.logo_url} alt={seleccion.nombre} width={28} height={28} className="object-contain" />
                  )}
                  <span className="text-sm text-gray-500">{seleccion?.nombre}</span>
                </div>
                <h1 className="text-3xl font-black uppercase text-gray-900 leading-tight">{jugador.nombre}</h1>

                {/* Posición + número */}
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="text-white text-xs font-bold px-3 py-1 rounded-full"
                    style={{ backgroundColor: posColor }}
                  >
                    {posLabel}
                  </span>
                  {jugador.numero && (
                    <span className="text-sm font-bold text-gray-500">#{jugador.numero}</span>
                  )}
                  {wc?.games.captain && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full">Capitán</span>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {apiData?.player.nationality && (
                  <BioItem label="Nacionalidad" value={apiData.player.nationality} />
                )}
                {jugador.edad && (
                  <BioItem label="Edad" value={`${jugador.edad} años`} />
                )}
                {apiData?.player.height && (
                  <BioItem label="Altura" value={apiData.player.height} />
                )}
                {apiData?.player.weight && (
                  <BioItem label="Peso" value={apiData.player.weight} />
                )}
                {apiData?.player.birth?.place && (
                  <BioItem label="Lugar de nac." value={apiData.player.birth.place} />
                )}
                {seleccion?.grupo && (
                  <BioItem label="Grupo" value={`Grupo ${seleccion.grupo}`} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas Mundial 2026 */}
        <div className="rounded-2xl border border-gray-200 p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-5">
            Estadísticas · Mundial 2026
          </p>

          {hasStats && wc ? (
            <div className="space-y-5">
              {/* Fila principal */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
                <StatBox label="Partidos" value={wc.games.appearences ?? 0} />
                <StatBox label="Minutos" value={wc.games.minutes ?? 0} />
                <StatBox label="Goles" value={wc.goals.total ?? 0} color="text-green-600" />
                <StatBox label="Asistencias" value={wc.goals.assists ?? 0} color="text-blue-600" />
                {jugador.posicion === "Goalkeeper" && (
                  <StatBox label="Goles rec." value={wc.goals.conceded ?? 0} color="text-red-500" />
                )}
                {jugador.posicion === "Goalkeeper" && (
                  <StatBox label="Paradas" value={wc.goals.saves ?? 0} color="text-yellow-500" />
                )}
                {jugador.posicion !== "Goalkeeper" && (
                  <StatBox label="Tiros" value={wc.shots.total ?? 0} />
                )}
                {jugador.posicion !== "Goalkeeper" && (
                  <StatBox label="A puerta" value={wc.shots.on ?? 0} />
                )}
              </div>

              {/* Disciplina + rating */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                {wc.games.rating && (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2">
                    <span className="text-2xl font-black text-gray-900">
                      {parseFloat(wc.games.rating).toFixed(1)}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Rating</span>
                  </div>
                )}
                {(wc.cards.yellow > 0 || wc.cards.red > 0) && (
                  <div className="flex items-center gap-2">
                    {wc.cards.yellow > 0 && (
                      <div className="flex items-center gap-1.5 bg-yellow-50 rounded-xl px-4 py-2">
                        <span className="w-3 h-4 bg-yellow-400 rounded-sm inline-block" />
                        <span className="font-bold text-yellow-700">{wc.cards.yellow}</span>
                      </div>
                    )}
                    {wc.cards.red > 0 && (
                      <div className="flex items-center gap-1.5 bg-red-50 rounded-xl px-4 py-2">
                        <span className="w-3 h-4 bg-red-500 rounded-sm inline-block" />
                        <span className="font-bold text-red-600">{wc.cards.red}</span>
                      </div>
                    )}
                  </div>
                )}
                {wc.dribbles.attempts && (wc.dribbles.attempts > 0) && (
                  <div className="flex items-center gap-1 bg-gray-50 rounded-xl px-4 py-2">
                    <span className="text-sm font-bold text-gray-900">{wc.dribbles.success ?? 0}/{wc.dribbles.attempts}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Regates</span>
                  </div>
                )}
                {wc.passes.key && (wc.passes.key > 0) && (
                  <div className="flex items-center gap-1 bg-gray-50 rounded-xl px-4 py-2">
                    <span className="text-sm font-bold text-gray-900">{wc.passes.key}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Pases clave</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-3">⏳</p>
              <p className="font-medium text-gray-500">Estadísticas aún no disponibles en la API</p>
              <p className="text-sm mt-1">La API puede tardar unas horas en registrar los datos del partido. Intenta actualizar más tarde.</p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

function BioItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

function StatBox({ label, value, color = "text-gray-900" }: { label: string; value: number; color?: string }) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
