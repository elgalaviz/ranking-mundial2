import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { jwtVerify } from "jose";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET env var is required");
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("quiniela_session")?.value;
  if (!token) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    userId = (payload as { userId: string }).userId;
  } catch {
    return NextResponse.json({ error: "Sesión inválida." }, { status: 401 });
  }

  const { codigo } = await req.json();
  if (!codigo) return NextResponse.json({ error: "Código requerido." }, { status: 400 });

  const supabase = getSupabase();

  const { data: liga, error: ligaError } = await supabase
    .from("ligas")
    .select("id, nombre, estado, max_participantes")
    .eq("codigo", codigo.toUpperCase())
    .single();

  if (ligaError || !liga) {
    return NextResponse.json({ error: "Liga no encontrada." }, { status: 404 });
  }

  if (liga.estado !== "activa") {
    return NextResponse.json({ error: "Esta liga aún no está activa." }, { status: 403 });
  }

  const { count } = await supabase
    .from("liga_miembros")
    .select("*", { count: "exact", head: true })
    .eq("liga_id", liga.id);

  if ((count ?? 0) >= liga.max_participantes) {
    return NextResponse.json({ error: "Esta liga ya está llena." }, { status: 403 });
  }

  const { error } = await supabase.from("liga_miembros").insert({
    liga_id: liga.id,
    user_id: userId,
  });

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, liga_nombre: liga.nombre });
}
