import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

const WA_NUMBER = "5218112993097";

const POSICION_ES: Record<string, string> = {
  Goalkeeper: "Portero",
  Defender: "Defensa",
  Midfielder: "Medio",
  Attacker: "Delantero",
};

const POSICION_ORDER = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];

const POSICION_COLOR: Record<string, string> = {
  Goalkeeper: "#f59e0b",
  Defender:   "#3b82f6",
  Midfielder: "#10b981",
  Attacker:   "#ef4444",
};

type Jugador = {
  id: number;
  nombre: string;
  posicion: string | null;
  numero: number | null;
  edad: number | null;
  foto_url: string | null;
  foto_custom_url: string | null;
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

  const porPosicion = POSICION_ORDER.reduce((acc, pos) => {
    const grupo = jugadores.filter(j => j.posicion === pos);
    if (grupo.length > 0) acc[pos] = grupo;
    return acc;
  }, {} as Record<string, Jugador[]>);

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

      {/* Header selección */}
      <div className="bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 py-8 flex items-center gap-6">
          <Link href="/selecciones" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Selecciones
          </Link>
          {seleccion.logo_url && (
            <img src={seleccion.logo_url} alt={seleccion.nombre} width={64} height={64} className="object-contain" />
          )}
          <div>
            <h1 className="text-2xl font-black uppercase">{seleccion.nombre}</h1>
            {seleccion.grupo && (
              <p className="text-[#00A550] text-sm font-semibold mt-0.5">Grupo {seleccion.grupo} · Mundial 2026</p>
            )}
            <p className="text-gray-400 text-sm mt-0.5">{jugadores.length} jugadores</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
        {Object.entries(porPosicion).map(([posicion, grupo]) => (
          <div key={posicion}>
            <h2 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: POSICION_COLOR[posicion] }}
              />
              {POSICION_ES[posicion] || posicion}
              <span className="text-gray-400 font-normal">({grupo.length})</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {grupo.map(j => (
                <PaniniCard key={j.id} jugador={j} seleccion={seleccion} />
              ))}
            </div>
          </div>
        ))}

        {jugadores.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p>Los jugadores de esta selección aún no están cargados.</p>
          </div>
        )}
      </div>
    </main>
  );
}

function PaniniCard({ jugador, seleccion }: { jugador: Jugador; seleccion: Seleccion }) {
  const foto = jugador.foto_custom_url || jugador.foto_url;
  const posColor = POSICION_COLOR[jugador.posicion || ""] || "#6b7280";
  const posLabel = POSICION_ES[jugador.posicion || ""] || jugador.posicion || "";

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-white flex flex-col"
      style={{ aspectRatio: "2/3" }}>

      {/* Número */}
      {jugador.numero && (
        <div className="absolute top-2 left-2 z-10 bg-black/60 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center">
          {jugador.numero}
        </div>
      )}

      {/* Foto */}
      <div className="flex-1 relative bg-gradient-to-b from-gray-100 to-gray-200 flex items-end justify-center overflow-hidden">
        {foto ? (
          <img
            src={foto}
            alt={jugador.nombre}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl">👤</span>
          </div>
        )}
      </div>

      {/* Franja inferior estilo Panini */}
      <div className="px-2 py-2 text-center" style={{ backgroundColor: posColor }}>
        {seleccion.logo_url && (
          <img src={seleccion.logo_url} alt="" width={16} height={16} className="object-contain mx-auto mb-1 opacity-80" />
        )}
        <p className="text-white text-[10px] font-black uppercase leading-tight truncate">
          {jugador.nombre.split(" ").pop()}
        </p>
        <p className="text-white/80 text-[8px] uppercase tracking-wide">{posLabel}</p>
      </div>
    </div>
  );
}
