import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppText } from "@/lib/ai/sendWhatsAppText";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getResultado(local: number, visitante: number): "local" | "empate" | "visitante" {
  if (local > visitante) return "local";
  if (local < visitante) return "visitante";
  return "empate";
}

function calcularPuntos(
  realLocal: number, realVisitante: number,
  pickLocal: number, pickVisitante: number
): number {
  if (pickLocal === realLocal && pickVisitante === realVisitante) return 6;
  if (getResultado(pickLocal, pickVisitante) === getResultado(realLocal, realVisitante)) return 3;
  return 0;
}

function buildMensaje(
  equipoLocal: string, equipoVisitante: string,
  realLocal: number, realVisitante: number,
  pickLocal: number, pickVisitante: number,
  puntos: number, totalPuntos: number
): string {
  const exacto = puntos === 6;
  const correcto = puntos === 3;
  const emoji = exacto ? "🎯" : correcto ? "✅" : "❌";
  const resultado = exacto ? "¡Marcador exacto!" : correcto ? "Resultado correcto" : "Sin puntos";

  return (
    `⚽ *${equipoLocal} ${realLocal} - ${realVisitante} ${equipoVisitante}*\n` +
    `Tu pronóstico: ${pickLocal} - ${pickVisitante}\n` +
    `${emoji} ${resultado} · *+${puntos} pts*\n\n` +
    `📊 Tu total acumulado: *${totalPuntos} pts*`
  );
}

export async function POST(req: NextRequest) {
  const { partido_id } = await req.json();
  if (!partido_id) {
    return NextResponse.json({ error: "partido_id requerido." }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: partido, error: pError } = await supabase
    .from("partidos")
    .select("id, equipo_local, equipo_visitante, goles_local, goles_visitante")
    .eq("id", partido_id)
    .single();

  if (pError || !partido) {
    return NextResponse.json({ error: "Partido no encontrado." }, { status: 404 });
  }

  if (partido.goles_local === null || partido.goles_visitante === null) {
    return NextResponse.json({ error: "El partido no tiene resultado capturado." }, { status: 400 });
  }

  const { data: picks, error: picksError } = await supabase
    .from("quiniela_picks")
    .select("id, user_id, pick_local, pick_visit")
    .eq("partido_id", partido_id);

  if (picksError || !picks || picks.length === 0) {
    return NextResponse.json({ success: true, actualizados: 0 });
  }

  // Actualizar puntos de todos los picks
  for (const pick of picks) {
    const puntos = calcularPuntos(
      partido.goles_local, partido.goles_visitante,
      pick.pick_local, pick.pick_visit
    );
    await supabase.from("quiniela_picks").update({ puntos }).eq("id", pick.id);
  }

  // Calcular totales acumulados y enviar WhatsApp a cada usuario
  const userIds = [...new Set(picks.map(p => p.user_id))];

  const { data: usuarios } = await supabase
    .from("users")
    .select("id, phone")
    .in("id", userIds);

  const phoneMap: Record<string, string> = {};
  for (const u of usuarios ?? []) {
    if (u.phone) phoneMap[u.id] = u.phone;
  }

  let enviados = 0;
  for (const pick of picks) {
    const phone = phoneMap[pick.user_id];
    if (!phone) continue;

    const puntos = calcularPuntos(
      partido.goles_local, partido.goles_visitante,
      pick.pick_local, pick.pick_visit
    );

    // Total acumulado del usuario
    const { data: allPicks } = await supabase
      .from("quiniela_picks")
      .select("puntos")
      .eq("user_id", pick.user_id);

    const totalPuntos = (allPicks ?? []).reduce((sum, p) => sum + (p.puntos ?? 0), 0);

    const mensaje = buildMensaje(
      partido.equipo_local, partido.equipo_visitante,
      partido.goles_local, partido.goles_visitante,
      pick.pick_local, pick.pick_visit,
      puntos, totalPuntos
    );

    try {
      await sendWhatsAppText({
        accessToken: WHATSAPP_TOKEN,
        phoneNumberId: PHONE_NUMBER_ID,
        to: phone,
        body: mensaje,
      });
      enviados++;
    } catch (e) {
      console.error(`Error enviando a ${phone}:`, e);
    }
  }

  return NextResponse.json({ success: true, actualizados: picks.length, enviados });
}
