import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Selecciones del Mundial 2026",
  description: "Conoce los jugadores de las 48 selecciones del Mundial 2026.",
};

const WA_NUMBER = "5218112993097";

const POSICION_ORDER = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];

type Seleccion = {
  id: number;
  nombre: string;
  logo_url: string | null;
  grupo: string | null;
  _count?: number;
};

async function getSelecciones(): Promise<Seleccion[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("selecciones")
    .select("id, nombre, logo_url, grupo")
    .order("nombre", { ascending: true });
  return data || [];
}

async function getConteos(): Promise<Record<number, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jugadores")
    .select("team_id");
  if (!data) return {};
  return data.reduce((acc, j) => {
    acc[j.team_id] = (acc[j.team_id] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
}

export default async function SeleccionesPage() {
  const [selecciones, conteos] = await Promise.all([getSelecciones(), getConteos()]);

  const grupos = selecciones.reduce((acc, s) => {
    const g = s.grupo || "Sin grupo";
    if (!acc[g]) acc[g] = [];
    acc[g].push(s);
    return acc;
  }, {} as Record<string, Seleccion[]>);

  const tieneGrupos = Object.keys(grupos).some(g => g !== "Sin grupo");

  return (
    <main className="min-h-screen bg-white text-gray-900">
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
          <h1 className="text-3xl font-black uppercase text-gray-900">Selecciones</h1>
          <p className="text-gray-500 mt-1">Mundial 2026 · {selecciones.length} selecciones</p>
        </div>

        {tieneGrupos ? (
          Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b)).map(([grupo, equipos]) => (
            <div key={grupo} className="mb-10">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#00A550] mb-4 border-b border-gray-100 pb-2">
                Grupo {grupo}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {equipos.map(s => (
                  <EquipoCard key={s.id} seleccion={s} jugadores={conteos[s.id] || 0} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {selecciones.map(s => (
              <EquipoCard key={s.id} seleccion={s} jugadores={conteos[s.id] || 0} />
            ))}
          </div>
        )}

        {selecciones.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">Los equipos aún no están cargados.</p>
            <p className="text-sm mt-1">Vuelve pronto.</p>
          </div>
        )}
      </div>
    </main>
  );
}

function EquipoCard({ seleccion, jugadores }: { seleccion: Seleccion; jugadores: number }) {
  return (
    <Link
      href={`/selecciones/${seleccion.id}`}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 hover:border-[#00A550] hover:shadow-md transition-all group"
    >
      {seleccion.logo_url ? (
        <img
          src={seleccion.logo_url}
          alt={seleccion.nombre}
          width={56}
          height={56}
          className="object-contain group-hover:scale-110 transition-transform"
        />
      ) : (
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl">🏳️</div>
      )}
      <p className="text-xs font-bold text-center text-gray-800 leading-tight">{seleccion.nombre}</p>
      {jugadores > 0 && (
        <p className="text-[10px] text-gray-400">{jugadores} jugadores</p>
      )}
    </Link>
  );
}
