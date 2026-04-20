import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Image from "next/image";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "ranking-mundial-26-secret-key-change-in-production"
);

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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

export default async function MisLigasPage() {
  const session = await getSession();
  if (!session) redirect("/quiniela/login");

  const supabase = getSupabase();

  // Ligas donde el usuario es miembro
  const { data: memberships } = await supabase
    .from("liga_miembros")
    .select("liga_id")
    .eq("user_id", session.userId);

  const ligaIds = (memberships ?? []).map((m) => m.liga_id);

  // Ligas del usuario (miembro o dueño por teléfono)
  const { data: ligasMiembro } = ligaIds.length > 0
    ? await supabase.from("ligas").select("id, nombre, codigo, estado, tier, max_participantes, owner_nombre").in("id", ligaIds)
    : { data: [] };

  const phone = session.phone;
  const altPhone = phone.startsWith("52") && !phone.startsWith("521")
    ? phone.replace(/^52/, "521")
    : phone.replace(/^521/, "52");

  const { data: ligasDueno } = await supabase
    .from("ligas")
    .select("id, nombre, codigo, estado, tier, max_participantes, owner_nombre")
    .in("owner_phone", [phone, altPhone]);

  // Unir sin duplicados
  type Liga = { id: string; nombre: string; codigo: string; estado: string; tier: number; max_participantes: number; owner_nombre: string };
  const todasMap = new Map<string, Liga>();
  for (const l of [...(ligasMiembro ?? []), ...(ligasDueno ?? [])]) {
    if (l) todasMap.set(l.id, l);
  }
  const ligas = [...todasMap.values()];

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/mifanbot-h.svg" alt="MiFanBot" width={140} height={36} priority />
          </Link>
          <Link href="/quiniela" className="text-sm text-gray-500 hover:text-gray-800">
            ← Quiniela
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-gray-900">Mis Ligas Privadas</h1>
          <Link
            href="/quiniela/ligas/nueva"
            className="bg-[#006847] hover:bg-green-800 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
          >
            + Nueva liga
          </Link>
        </div>

        {ligas.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">⚽</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Aún no tienes ligas</h2>
            <p className="text-gray-500 text-sm mb-6">Crea tu propia liga privada o únete con un código.</p>
            <Link
              href="/quiniela/ligas/nueva"
              className="inline-block bg-[#006847] text-white font-bold px-6 py-3 rounded-xl"
            >
              Crear mi Liga →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {ligas.map((liga) => (
              <Link
                key={liga.id}
                href={`/quiniela/ligas/${liga.codigo}`}
                className="block bg-white border border-gray-200 hover:border-[#006847]/50 rounded-2xl p-5 shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg">{liga.nombre}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Código: <span className="font-mono font-bold">{liga.codigo}</span></p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                      liga.estado === "activa"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {liga.estado === "activa" ? "Activa" : "Pendiente"}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {liga.tier === 0 ? "Gratis" : `$${liga.tier} MXN`} · hasta {liga.max_participantes} personas
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
