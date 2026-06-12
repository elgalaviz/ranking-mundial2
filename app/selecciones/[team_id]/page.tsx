import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

const WA_NUMBER = "5218112993097";
const API_KEY = process.env.API_FOOTBALL_KEY || "";
const API_BASE = "https://v3.football.api-sports.io";

const POSICION_ES: Record<string, string> = {
  Goalkeeper: "Porteros",
  Defender: "Defensas",
  Midfielder: "Mediocampistas",
  Attacker: "Delanteros",
};

const POSICION_ORDER = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];

const POSICION_COLOR: Record<string, string> = {
  Goalkeeper: "#f59e0b",
  Defender: "#3b82f6",
  Midfielder: "#10b981",
  Attacker: "#ef4444",
};

type Jugador = {
  id: number;
  nombre: string;
  posicion: string | null;
  numero: number | null;
  edad: number | null;
  foto_url: string | null;
  foto_custom_url: string | null;
  destacado: boolean | null;
};

type Seleccion = {
  id: number;
  nombre: string;
  logo_url: string | null;
  grupo: string | null;
};

async function getData(teamId: number) {
  const supabase = await createClient();
  const [{ data: seleccion }, { data: jugadores }] = await Promise.all([
    supabase.from("selecciones").select("*").eq("id", teamId).single(),
    supabase.from("jugadores").select("*").eq("team_id", teamId).order("numero", { ascending: true }),
  ]);
  return { seleccion: seleccion as Seleccion | null, jugadores: (jugadores || []) as Jugador[] };
}

async function getCoach(teamId: number): Promise<string | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch(`${API_BASE}/coachs?team=${teamId}`, {
      headers: { "x-apisports-key": API_KEY },
      next: { revalidate: 86400 },
    });
    const json = await res.json();
    const coach = json.response?.[0];
    if (!coach) return null;
    // Usar firstname + lastname si están disponibles
    if (coach.firstname && coach.lastname) return `${coach.firstname} ${coach.lastname}`;
    return coach.name ?? null;
  } catch {
    return null;
  }
}

async function getStats(teamId: number): Promise<{ jugados: number; ganados: number; empatados: number; perdidos: number; golesFavor: number; golesContra: number } | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch(`${API_BASE}/teams/statistics?league=1&season=2026&team=${teamId}`, {
      headers: { "x-apisports-key": API_KEY },
      next: { revalidate: 1800 },
    });
    const json = await res.json();
    const s = json.response;
    if (!s) return null;
    return {
      jugados: s.fixtures?.played?.total ?? 0,
      ganados: s.fixtures?.wins?.total ?? 0,
      empatados: s.fixtures?.draws?.total ?? 0,
      perdidos: s.fixtures?.loses?.total ?? 0,
      golesFavor: s.goals?.for?.total?.total ?? 0,
      golesContra: s.goals?.against?.total?.total ?? 0,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ team_id: string }> }): Promise<Metadata> {
  const { team_id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("selecciones").select("nombre").eq("id", Number(team_id)).single();
  return {
    title: data ? `${data.nombre} — Mundial 2026` : "Selección",
    description: data ? `Jugadores de ${data.nombre} en el Mundial 2026.` : "",
  };
}

export default async function SeleccionPage({ params }: { params: Promise<{ team_id: string }> }) {
  const { team_id } = await params;
  const teamId = Number(team_id);
  if (isNaN(teamId)) notFound();

  const { seleccion, jugadores } = await getData(teamId);
  if (!seleccion) notFound();

  const [coach, stats] = await Promise.all([
    getCoach(teamId),
    getStats(teamId),
  ]);

  const porPosicion = POSICION_ORDER.reduce((acc, pos) => {
    const grupo = jugadores.filter(j => j.posicion === pos);
    if (grupo.length > 0) acc[pos] = grupo;
    return acc;
  }, {} as Record<string, Jugador[]>);

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="bg-black shadow-md">
        <div className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
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

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Breadcrumb */}
        <Link href="/selecciones" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          ← Todas las selecciones
        </Link>

        {/* Header equipo */}
        <div className="border border-gray-200 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Logo */}
            <div className="shrink-0">
              {seleccion.logo_url ? (
                <img src={seleccion.logo_url} alt={seleccion.nombre} width={80} height={80} className="object-contain" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-4xl">🏳️</div>
              )}
            </div>

            {/* Nombre + grupo */}
            <div className="flex-1">
              <h1 className="text-3xl font-black uppercase text-gray-900">{seleccion.nombre}</h1>
              {seleccion.grupo && (
                <p className="text-[#00A550] font-semibold text-sm mt-0.5">Grupo {seleccion.grupo} · Mundial 2026</p>
              )}
            </div>

            {/* Stats: participaciones / entrenador */}
            <div className="flex gap-6 text-center sm:text-right">
              {coach && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Entrenador</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{coach}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Jugadores</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{jugadores.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Record Mundial 2026 */}
        {stats && stats.jugados > 0 && (
          <div className="border border-gray-200 rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Record Mundial 2026</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
              <StatBox label="Jugados" value={stats.jugados} color="text-gray-900" />
              <StatBox label="Ganados" value={stats.ganados} color="text-green-600" />
              <StatBox label="Empates" value={stats.empatados} color="text-yellow-500" />
              <StatBox label="Perdidos" value={stats.perdidos} color="text-red-500" />
              <StatBox label="Goles favor" value={stats.golesFavor} color="text-gray-900" />
              <StatBox label="Goles contra" value={stats.golesContra} color="text-gray-400" />
            </div>
          </div>
        )}

        {/* Lista de jugadores */}
        <div>
          <h2 className="text-xl font-black uppercase text-gray-900 mb-6">
            Plantel {seleccion.nombre}
          </h2>

          <div className="space-y-8">
            {Object.entries(porPosicion).map(([posicion, grupo]) => (
              <div key={posicion}>
                {/* Cabecera posición */}
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: POSICION_COLOR[posicion] }}
                  />
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
                    {POSICION_ES[posicion] || posicion}
                  </h3>
                  <span className="text-gray-400 text-sm font-normal">({grupo.length})</span>
                </div>

                {/* Grid jugadores */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {grupo.map(j => (
                    <JugadorCard key={j.id} jugador={j} posicion={posicion} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {jugadores.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <p>Los jugadores de esta selección aún no están cargados.</p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function JugadorCard({ jugador, posicion }: { jugador: Jugador; posicion: string }) {
  const foto = jugador.foto_custom_url || jugador.foto_url;
  const posColor = POSICION_COLOR[posicion] || "#6b7280";
  const apellido = jugador.nombre.split(" ").slice(-1)[0];

  return (
    <Link href={`/jugadores/${jugador.id}`} className={`flex flex-col items-center text-center gap-1.5 p-2 rounded-xl transition-shadow hover:shadow-md cursor-pointer ${jugador.destacado ? "ring-2 ring-yellow-400" : ""}`}>
      {/* Foto circular */}
      <div
        className="w-16 h-16 rounded-full overflow-hidden shrink-0 relative"
        style={{ backgroundColor: "#f3f4f6", border: `2px solid ${posColor}20` }}
      >
        {foto ? (
          <img
            src={foto}
            alt={jugador.nombre}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">
            👤
          </div>
        )}
        {/* Número encima */}
        {jugador.numero && (
          <div
            className="absolute bottom-0 right-0 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none"
            style={{ backgroundColor: posColor }}
          >
            {jugador.numero}
          </div>
        )}
      </div>

      {/* Nombre */}
      <div>
        {jugador.destacado && <span className="text-yellow-400 text-xs">★</span>}
        <p className="text-xs font-bold text-gray-900 leading-tight truncate w-full max-w-20" title={jugador.nombre}>
          {apellido}
        </p>
        {jugador.edad && (
          <p className="text-[10px] text-gray-400">{jugador.edad} años</p>
        )}
      </div>
    </Link>
  );
}
