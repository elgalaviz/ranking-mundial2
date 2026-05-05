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

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { equipo_local, equipo_visitante, fecha_partido, pronostico } = await req.json();

  if (!equipo_local || !equipo_visitante || !pronostico) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  if (fecha_partido && new Date(fecha_partido) < new Date()) {
    return NextResponse.json({ error: "Este partido ya comenzó" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: user } = await supabase
    .from("users")
    .select("whatsapp_id")
    .eq("id", session.userId)
    .single();

  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const { data: existing } = await supabase
    .from("pronosticos")
    .select("id")
    .eq("whatsapp_id", user.whatsapp_id)
    .eq("equipo_local", equipo_local)
    .eq("equipo_visitante", equipo_visitante)
    .maybeSingle();

  if (existing) {
    await supabase.from("pronosticos").update({ pronostico }).eq("id", existing.id);
  } else {
    await supabase.from("pronosticos").insert({
      whatsapp_id: user.whatsapp_id,
      equipo_local,
      equipo_visitante,
      pronostico,
      momio: 1,
      fecha_partido: fecha_partido ?? null,
    });
  }

  return NextResponse.json({ ok: true, pronostico });
}
