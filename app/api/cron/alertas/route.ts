import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppText } from "@/lib/ai/sendWhatsAppText";

export const runtime = "nodejs";

const CRON_SECRET = process.env.CRON_SECRET || "";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function formatAlertMessage(partido: Record<string, string>, patrocinador: string | null): string {
  const fecha = new Date(partido.fecha_utc).toLocaleTimeString("es-MX", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    minute: "2-digit",
  });

  let msg = `⚽ *¡En 15 minutos arranca!*\n\n`;
  msg += `🆚 *${partido.equipo_local}* vs *${partido.equipo_visitante}*\n`;
  if (partido.estadio) msg += `🏟 ${partido.estadio}\n`;
  if (partido.ciudad) msg += `📍 ${partido.ciudad}\n`;
  msg += `🕐 ${fecha} hrs CDMX\n`;
  if (partido.fase) msg += `\n🏆 ${partido.fase}${partido.grupo ? ` · Grupo ${partido.grupo}` : ""}`;
  if (patrocinador) msg += `\n\n${patrocinador}`;

  return msg;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  try {
    const ahora = new Date();
    const en15 = new Date(ahora.getTime() + 15 * 60 * 1000);
    const en20 = new Date(ahora.getTime() + 20 * 60 * 1000);

    // Buscar partidos que arrancan en 15-20 minutos y sin alerta enviada
    const { data: partidos, error } = await supabase
      .from("partidos")
      .select("*")
      .gte("fecha_utc", en15.toISOString())
      .lte("fecha_utc", en20.toISOString())
      .eq("alerta_enviada", false);

    if (error) throw error;
    if (!partidos || partidos.length === 0) {
      return NextResponse.json({ ok: true, enviadas: 0, msg: "Sin partidos próximos" });
    }

    // Obtener patrocinador activo (si hay)
    const { data: patrocinadores } = await supabase
      .from("patrocinadores")
      .select("mensaje_texto")
      .eq("activo", true)
      .limit(1)
      .single();

    const mensajePatrocinador = patrocinadores?.mensaje_texto || null;

    // Obtener usuarios que aceptaron alertas (o no han respondido aún = null)
    const { data: usuarios } = await supabase
      .from("users")
      .select("id, phone")
      .neq("alertas_activas", false);

    if (!usuarios || usuarios.length === 0) {
      return NextResponse.json({ ok: true, enviadas: 0, msg: "Sin usuarios registrados" });
    }

    let totalEnviadas = 0;

    for (const partido of partidos) {
      const mensaje = formatAlertMessage(partido, mensajePatrocinador);

      // Enviar a todos los usuarios
      const envios = usuarios.map((user: Record<string, string>) =>
        sendWhatsAppText({
          accessToken: WHATSAPP_TOKEN,
          phoneNumberId: PHONE_NUMBER_ID,
          to: user.phone,
          body: mensaje,
        }).then(async (result) => {
          if (result.ok) {
            await supabase.from("registros_whatsapp").insert({
              user_id: user.id,
              partido_id: partido.id,
              tipo_mensaje: "alerta_partido",
            });
            totalEnviadas++;
          }
        })
      );

      await Promise.allSettled(envios);

      // Marcar alerta como enviada
      await supabase
        .from("partidos")
        .update({ alerta_enviada: true })
        .eq("id", partido.id);
    }

    return NextResponse.json({
      ok: true,
      enviadas: totalEnviadas,
      partidos: partidos.length,
      usuarios: usuarios.length,
    });
  } catch (err) {
    console.error("Cron alertas error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET para verificar que el endpoint responde
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "cron/alertas activo" });
}
