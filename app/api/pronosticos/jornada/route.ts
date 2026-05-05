import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET env var is required");
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

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
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const jornada = req.nextUrl.searchParams.get("jornada");
  if (!jornada) return NextResponse.json({ error: "Jornada requerida" }, { status: 400 });

  const supabase = getSupabase();

  const { data: user } = await supabase
    .from("users")
    .select("whatsapp_id")
    .eq("id", session.userId)
    .single();

  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const { data: partidos } = await supabase
    .from("partidos")
    .select("id, equipo_local, equipo_visitante, fecha_utc, estadio, ciudad, fase, grupo, jornada, goles_local, goles_visitante")
    .eq("jornada", parseInt(jornada))
    .order("fecha_utc", { ascending: true });

  if (!partidos || partidos.length === 0) {
    return NextResponse.json({ partidos: [], pronos: [] });
  }

  const equiposLocales = partidos.map((p) => p.equipo_local);

  const { data: pronos } = await supabase
    .from("pronosticos")
    .select("equipo_local, equipo_visitante, pronostico, acerto")
    .eq("whatsapp_id", user.whatsapp_id)
    .in("equipo_local", equiposLocales);

  return NextResponse.json({ partidos, pronos: pronos ?? [] });
}
