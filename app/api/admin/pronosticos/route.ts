import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const GOD_EMAIL = process.env.ADMIN_EMAIL!;

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== GOD_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const whatsappId = searchParams.get("whatsapp_id");

  const db = getAdmin();

  if (whatsappId) {
    const { data: pronos } = await db
      .from("pronosticos")
      .select("id, equipo_local, equipo_visitante, pronostico, momio, fecha_partido, acerto, notificado, created_at")
      .eq("whatsapp_id", whatsappId)
      .order("fecha_partido", { ascending: false });
    return NextResponse.json(pronos ?? []);
  }

  // Resumen por usuario
  const { data: pronos } = await db
    .from("pronosticos")
    .select("whatsapp_id, acerto");

  const { data: users } = await db
    .from("users")
    .select("id, whatsapp_id, name, phone");

  const userMap = new Map((users ?? []).map((u) => [u.whatsapp_id, u]));

  const grouped: Record<string, { total: number; acertados: number; pendientes: number }> = {};
  for (const p of pronos ?? []) {
    if (!grouped[p.whatsapp_id]) grouped[p.whatsapp_id] = { total: 0, acertados: 0, pendientes: 0 };
    grouped[p.whatsapp_id].total++;
    if (p.acerto === true) grouped[p.whatsapp_id].acertados++;
    if (p.acerto === null) grouped[p.whatsapp_id].pendientes++;
  }

  const result = Object.entries(grouped).map(([whatsapp_id, stats]) => ({
    whatsapp_id,
    ...stats,
    user: userMap.get(whatsapp_id) ?? null,
  })).sort((a, b) => b.total - a.total);

  return NextResponse.json(result);
}
