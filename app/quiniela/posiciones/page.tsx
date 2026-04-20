import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Image from "next/image";
import PosicionesTabla from "./PosicionesTabla";

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
  } catch {
    return null;
  }
}

type Posicion = {
  userId: string;
  nombre: string;
  phone: string;
  puntos: number;
};

async function getPosiciones(): Promise<Posicion[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: picks } = await supabase
    .from("quiniela_picks")
    .select("user_id, puntos");

  const { data: users } = await supabase
    .from("users")
    .select("id, name, phone");

  if (!picks || !users) return [];

  const totales: Record<string, number> = {};
  for (const p of picks) {
    totales[p.user_id] = (totales[p.user_id] ?? 0) + (p.puntos ?? 0);
  }

  const posiciones: Posicion[] = users
    .filter((u) => totales[u.id] !== undefined || picks.some((p) => p.user_id === u.id))
    .map((u) => ({
      userId: u.id,
      nombre: u.name ?? "Fan",
      phone: u.phone ?? "",
      puntos: totales[u.id] ?? 0,
    }))
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, 25);

  return posiciones;
}

export default async function PosicionesPage() {
  const session = await getSession();
  if (!session) redirect("/quiniela/login");

  const posiciones = await getPosiciones();

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/mifanbot-h.svg" alt="MiFanBot" width={140} height={36} priority />
          </Link>
          <Link href="/quiniela" className="text-sm text-[#006847] font-medium hover:underline">
            ← Mis pronósticos
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-gray-900 mb-1">Tabla de Posiciones</h1>
        <p className="text-gray-500 text-sm mb-8">Top 25 participantes · Quiniela Mundial 2026</p>

        <PosicionesTabla posiciones={posiciones} miUserId={session.userId} />
      </div>
    </main>
  );
}
