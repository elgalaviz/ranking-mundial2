import { NextResponse } from "next/server";
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
  } catch {
    return null;
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const supabase = getSupabase();

  const { data: user } = await supabase
    .from("users")
    .select("whatsapp_id")
    .eq("id", session.userId)
    .single();

  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const { data: pronosticos, error } = await supabase
    .from("pronosticos")
    .select("id, equipo_local, equipo_visitante, pronostico, momio, fecha_partido, acerto, created_at")
    .eq("whatsapp_id", user.whatsapp_id)
    .order("fecha_partido", { ascending: false });

  if (error) return NextResponse.json({ error: "Error al obtener pronósticos" }, { status: 500 });

  return NextResponse.json({ pronosticos: pronosticos ?? [] });
}
