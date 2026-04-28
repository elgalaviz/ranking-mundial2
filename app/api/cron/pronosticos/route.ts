import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppText } from "@/lib/ai/sendWhatsAppText";
import { pronoAcertoMessage, pronoFalloMessage } from "@/lib/fanbot/messages";

export const runtime = "nodejs";

const CRON_SECRET = process.env.CRON_SECRET || "";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const PRONO_SPONSOR = process.env.PRONO_SPONSOR || "";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  // Pronósticos pendientes de notificar
  const { data: pronosticos, error } = await supabase
    .from("pronosticos")
    .select("*")
    .is("acerto", null)
    .eq("notificado", false);

  if (error || !pronosticos || pronosticos.length === 0) {
    return NextResponse.json({ ok: true, procesados: 0, msg: "Sin pronósticos pendientes" });
  }

  let procesados = 0;

  for (const prono of pronosticos) {
    // Buscar el partido terminado correspondiente
    const { data: partido } = await supabase
      .from("partidos")
      .select("equipo_local, equipo_visitante, goles_local, goles_visitante")
      .ilike("equipo_local", `%${prono.equipo_local.slice(0, 5)}%`)
      .ilike("equipo_visitante", `%${prono.equipo_visitante.slice(0, 5)}%`)
      .not("goles_local", "is", null)
      .not("goles_visitante", "is", null)
      .maybeSingle();

    if (!partido) continue; // Partido aún no ha terminado

    // Determinar resultado real
    let resultadoReal: "local" | "visitante" | "empate";
    if (partido.goles_local > partido.goles_visitante) resultadoReal = "local";
    else if (partido.goles_local < partido.goles_visitante) resultadoReal = "visitante";
    else resultadoReal = "empate";

    const acerto = prono.pronostico === resultadoReal;

    const partidoStr = `${partido.equipo_local} ${partido.goles_local}-${partido.goles_visitante} ${partido.equipo_visitante}`;

    const equipoElegido =
      prono.pronostico === "local" ? prono.equipo_local
      : prono.pronostico === "visitante" ? prono.equipo_visitante
      : "Empate";

    const resultadoRealStr =
      resultadoReal === "local" ? partido.equipo_local
      : resultadoReal === "visitante" ? partido.equipo_visitante
      : "Empate";

    const msg = acerto
      ? pronoAcertoMessage(partidoStr, equipoElegido, prono.momio, 200, PRONO_SPONSOR || undefined)
      : pronoFalloMessage(partidoStr, equipoElegido, resultadoRealStr);

    await sendWhatsAppText({
      accessToken: WHATSAPP_TOKEN,
      phoneNumberId: PHONE_NUMBER_ID,
      to: prono.whatsapp_id,
      body: msg,
    });

    await supabase
      .from("pronosticos")
      .update({ acerto, notificado: true })
      .eq("id", prono.id);

    procesados++;
  }

  return NextResponse.json({ ok: true, procesados });
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "cron/pronosticos activo" });
}
