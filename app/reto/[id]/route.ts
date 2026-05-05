import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idShort } = await params;
  const waNumber = process.env.WA_BOT_NUMBER || "";

  if (!idShort || idShort.length !== 32) {
    return NextResponse.redirect(`https://wa.me/${waNumber}`);
  }

  const partidoId = [
    idShort.slice(0, 8), idShort.slice(8, 12),
    idShort.slice(12, 16), idShort.slice(16, 20), idShort.slice(20),
  ].join("-");

  const supabase = getSupabase();
  const { data: partido } = await supabase
    .from("partidos")
    .select("equipo_local, equipo_visitante")
    .eq("id", partidoId)
    .single();

  const texto = partido
    ? `me retaron y quiero pronosticar el ${partido.equipo_local} vs ${partido.equipo_visitante}`
    : "me retaron y quiero pronosticar";

  return NextResponse.redirect(`https://wa.me/${waNumber}?text=${encodeURIComponent(texto)}`);
}
