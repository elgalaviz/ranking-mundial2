import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { jwtVerify } from "jose";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET env var is required");
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getUserId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("quiniela_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return (payload as { userId: string }).userId;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { partido_id, goles_local, goles_visitante } = await req.json();

  if (
    !partido_id ||
    typeof goles_local !== "number" ||
    typeof goles_visitante !== "number" ||
    goles_local < 0 ||
    goles_visitante < 0
  ) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: partido, error: partidoError } = await supabase
    .from("partidos")
    .select("id, fecha_utc")
    .eq("id", partido_id)
    .single();

  if (partidoError || !partido) {
    return NextResponse.json({ error: "Partido no encontrado." }, { status: 404 });
  }

  const minutosRestantes = (new Date(partido.fecha_utc).getTime() - Date.now()) / 60000;
  if (minutosRestantes < 5) {
    return NextResponse.json(
      { error: "Este partido ya está bloqueado para pronósticos." },
      { status: 403 }
    );
  }

  const { data: existing } = await supabase
    .from("quiniela_picks")
    .select("id")
    .eq("user_id", userId)
    .eq("partido_id", partido_id)
    .single();

  const { error } = existing
    ? await supabase
        .from("quiniela_picks")
        .update({ pick_local: goles_local, pick_visit: goles_visitante })
        .eq("id", existing.id)
    : await supabase
        .from("quiniela_picks")
        .insert({ user_id: userId, partido_id, pick_local: goles_local, pick_visit: goles_visitante });

  if (error) {
    console.error("Error guardando pick:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("quiniela_picks")
    .select("partido_id, pick_local, pick_visit")
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: "No se pudieron cargar los pronósticos." }, { status: 500 });
  }

  return NextResponse.json(data);
}
