import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Image from "next/image";
import QuinielaPartidos from "./QuinielaPartidos";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET env var is required");
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

type Partido = {
  id: string;
  equipo_local: string;
  equipo_visitante: string;
  fecha_utc: string;
  estadio: string | null;
  ciudad: string | null;
  fase: string | null;
  grupo: string | null;
  jornada: number | null;
};

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("quiniela_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; phone: string };
  } catch {
    return null;
  }
}

async function getPartidos(): Promise<Partido[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from("partidos")
    .select("id, equipo_local, equipo_visitante, fecha_utc, estadio, ciudad, fase, grupo, jornada")
    .not("jornada", "is", null)
    .order("jornada", { ascending: true })
    .order("fecha_utc", { ascending: true });

  if (!data || data.length === 0) return [];

  const now = new Date();
  const DOS_HORAS = 2 * 60 * 60 * 1000;

  // Jornadas únicas ordenadas
  const jornadas = [...new Set(data.map((p) => p.jornada as number))].sort((a, b) => a - b);

  // La jornada activa es la primera cuyo último partido no ha terminado aún
  let jornadaActiva = jornadas[0];
  for (const j of jornadas) {
    const partidos = data.filter((p) => p.jornada === j);
    const ultimoInicio = Math.max(...partidos.map((p) => new Date(p.fecha_utc).getTime()));
    const fin = ultimoInicio + DOS_HORAS;
    if (now.getTime() < fin) {
      jornadaActiva = j;
      break;
    }
    jornadaActiva = j; // si todas terminaron, queda la última
  }

  return data.filter((p) => p.jornada === jornadaActiva);
}

async function getPuntos(userId: string): Promise<number> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase
    .from("quiniela_picks")
    .select("puntos")
    .eq("user_id", userId);

  return (data ?? []).reduce((sum, r) => sum + (r.puntos ?? 0), 0);
}

export default async function QuinielaPage() {
  const session = await getSession();
  if (!session) redirect("/quiniela/login");

  const [partidos, puntos] = await Promise.all([
    getPartidos(),
    getPuntos(session.userId),
  ]);

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-[#006847] shadow-md">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/mifanbot-h.svg" alt="MiFanBot" width={140} height={36} priority />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/quiniela/posiciones" className="text-sm font-semibold text-white hover:text-green-200 transition-colors">
              Puntos: {puntos}
            </Link>
            <span className="text-sm text-green-200 hidden sm:block">
              +{session.phone}
            </span>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-sm text-white hover:text-green-200 transition-colors"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
            <h1 className="text-3xl font-black text-gray-900">Quiniela Mundial 2026</h1>
            <div className="flex items-center gap-2">
              <Link
                href="/quiniela/ligas"
                className="flex items-center gap-2 border border-[#006847] text-[#006847] hover:bg-green-50 text-sm font-bold px-4 py-2 rounded-xl transition-colors"
              >
                ⚽ Liga Privada
              </Link>
              <Link
                href="/quiniela/posiciones"
                className="flex items-center gap-2 bg-[#006847] hover:bg-green-800 text-white text-sm font-bold px-4 py-2 rounded-xl shadow transition-colors"
              >
                🏆 TOP RANKING
              </Link>
            </div>
          </div>
          <p className="text-gray-500 mt-1">
            Pronostica los resultados. Los partidos se bloquean 5 minutos antes de iniciar.
          </p>
        </div>

        <QuinielaPartidos partidos={partidos} userId={session.userId} />
      </div>
    </main>
  );
}
