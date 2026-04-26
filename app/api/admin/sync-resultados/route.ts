// POST /api/admin/sync-resultados
// Actualiza goles_local / goles_visitante de los partidos terminados o en vivo.
// Llamar desde el cron después de cada ronda de partidos.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getFinishedFixtures, getLiveFixtures } from "@/lib/api-football/client";
import { fixtureToResultado } from "@/lib/api-football/mappers";
import { sendWhatsAppText } from "@/lib/ai/sendWhatsAppText";
import { pronoAcertoMessage, pronoFalloMessage } from "@/lib/fanbot/messages";

const CRON_SECRET = process.env.CRON_SECRET || "";

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

  try {
    const supabase = getSupabase();

    // Traer partidos terminados + en vivo
    const [finished, live] = await Promise.all([
      getFinishedFixtures(),
      getLiveFixtures(),
    ]);

    const todos = [...finished, ...live];
    if (todos.length === 0) {
      return NextResponse.json({ ok: true, actualizados: 0, msg: "Sin partidos terminados o en vivo." });
    }

    let actualizados = 0;

    for (const f of todos) {
      const resultado = fixtureToResultado(f);
      if (!resultado) continue;

      // Buscar en Supabase por equipos (tolerante a diferencias de nombre)
      const { data: partido } = await supabase
        .from("partidos")
        .select("id, goles_local, goles_visitante")
        .ilike("equipo_local", `%${f.teams.home.name}%`)
        .ilike("equipo_visitante", `%${f.teams.away.name}%`)
        .single();

      if (!partido) continue;

      // Solo actualizar si los goles cambiaron
      if (partido.goles_local === resultado.goles_local &&
          partido.goles_visitante === resultado.goles_visitante) continue;

      const { error } = await supabase
        .from("partidos")
        .update(resultado)
        .eq("id", partido.id);

      if (!error) {
        actualizados++;

        // Solo evaluar pronósticos cuando el partido terminó (score completo, no en vivo)
        const status = f.fixture.status.short;
        const esFinal = status === "FT" || status === "AET" || status === "PEN";
        if (esFinal) {
          const winner =
            resultado.goles_local > resultado.goles_visitante ? "local"
            : resultado.goles_visitante > resultado.goles_local ? "visitante"
            : "empate";

          const { data: pronos } = await supabase
            .from("pronosticos")
            .select("id, whatsapp_id, pronostico, momio")
            .ilike("equipo_local", `%${f.teams.home.name.slice(0, 5)}%`)
            .ilike("equipo_visitante", `%${f.teams.away.name.slice(0, 5)}%`)
            .is("acerto", null);

          if (pronos && pronos.length > 0) {
            const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
            const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
            const PRONO_SPONSOR = process.env.PRONO_SPONSOR || "";
            const nombrePartido = `${partido.equipo_local} ${resultado.goles_local}-${resultado.goles_visitante} ${partido.equipo_visitante}`;
            const labelGanador =
              winner === "local" ? partido.equipo_local
              : winner === "visitante" ? partido.equipo_visitante
              : "Empate";

            for (const prono of pronos) {
              const acerto = prono.pronostico === winner;
              await supabase.from("pronosticos").update({ acerto, notificado: true }).eq("id", prono.id);

              const labelElegido =
                prono.pronostico === "local" ? partido.equipo_local
                : prono.pronostico === "visitante" ? partido.equipo_visitante
                : "Empate";

              const msg = acerto
                ? pronoAcertoMessage(nombrePartido, labelElegido, prono.momio, 200, PRONO_SPONSOR)
                : pronoFalloMessage(nombrePartido, labelElegido, labelGanador);

              try {
                await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: prono.whatsapp_id, body: msg });
              } catch (e) {
                console.error(`Error notificando pronóstico a ${prono.whatsapp_id}:`, e);
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true, revisados: todos.length, actualizados });
  } catch (err) {
    console.error("sync-resultados error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "sync-resultados activo" });
}
