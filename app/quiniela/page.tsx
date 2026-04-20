import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import QuinielaPartidos from "./QuinielaPartidos";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "ranking-mundial-26-secret-key-change-in-production"
);

type Partido = {
  id: string;
  equipo_local: string;
  equipo_visitante: string;
  fecha_utc: string;
  estadio: string | null;
  ciudad: string | null;
  fase: string | null;
  grupo: string | null;
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
    .select("id, equipo_local, equipo_visitante, fecha_utc, estadio, ciudad, fase, grupo")
    .gte("fecha_utc", new Date().toISOString())
    .order("fecha_utc", { ascending: true })
    .limit(64);

  return data ?? [];
}

export default async function QuinielaPage() {
  const session = await getSession();
  if (!session) redirect("/quiniela/login");

  const partidos = await getPartidos();

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-black text-[#006847]">
            RANKING <span className="text-[#CE1126]">MUNDIAL</span> 26
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">
              +{session.phone}
            </span>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">Quiniela Mundial 2026</h1>
          <p className="text-gray-500 mt-1">
            Pronostica los resultados. Los partidos se bloquean 5 minutos antes de iniciar.
          </p>
        </div>

        <QuinielaPartidos partidos={partidos} userId={session.userId} />
      </div>
    </main>
  );
}
