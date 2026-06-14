import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppText } from "@/lib/ai/sendWhatsAppText";
import { sendWhatsAppTemplate, sendWhatsAppReplyButtons } from "@/lib/ai/sendWhatsAppInteractive";

export const runtime = "nodejs";

const CRON_SECRET = process.env.CRON_SECRET || "";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const ALERT_TEMPLATE_NAME = process.env.ALERT_TEMPLATE_NAME || "";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function buildTemplateParams(partido: Record<string, string>, patrocinador: string | null): string[] {
  return [
    partido.equipo_local,
    partido.equipo_visitante,
    partido.estadio || "",
    partido.ciudad || "",
    partido.grupo ? `Grupo ${partido.grupo}` : (partido.fase || ""),
    patrocinador || "",
    partido.canales || "",
  ];
}

function formatAlertMessage(partido: Record<string, string>, patrocinador: string | null): string {
  let msg = `⚽ *¡En 15 minutos arranca!*\n\n`;
  msg += `🆚 *${partido.equipo_local}* vs *${partido.equipo_visitante}*\n`;
  if (partido.estadio) msg += `🏟 ${partido.estadio} en ${partido.ciudad || ""}\n`;
  if (partido.grupo) msg += `👥 Grupo ${partido.grupo}\n`;
  if (partido.canales) msg += `📺 Donde ver: ${partido.canales}\n`;
  if (patrocinador) msg += `\n🎯 ${patrocinador}`;
  return msg;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!CRON_SECRET || !secret || secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  try {
    const ahora = new Date();
    const en15 = new Date(ahora.getTime() + 15 * 60 * 1000);
    const en20 = new Date(ahora.getTime() + 20 * 60 * 1000);

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

    const { data: patrocinadores } = await supabase
      .from("patrocinadores")
      .select("mensaje_texto")
      .eq("activo", true)
      .limit(1)
      .single();

    const mensajePatrocinador = patrocinadores?.mensaje_texto || null;

    // Usuarios con alertas activas
    const { data: usuarios } = await supabase
      .from("users")
      .select("id, phone")
      .eq("alertas_activas", true)
      .not("phone", "is", null);

    if (!usuarios || usuarios.length === 0) {
      return NextResponse.json({ ok: true, enviadas: 0, msg: "Sin usuarios registrados" });
    }

    // Detectar qué usuarios tienen ventana de 24h abierta (escribieron en las últimas 24h)
    const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const { data: conVentana } = await supabase
      .from("mensajes_bot")
      .select("user_id")
      .eq("role", "user")
      .gte("created_at", hace24h);

    const idsConVentana = new Set((conVentana || []).map((m: { user_id: string }) => m.user_id));

    let totalEnviadas = 0;
    let totalFallidas = 0;
    let usaronVentana = 0;
    let usaronTemplate = 0;
    const erroresEnvio: string[] = [];

    for (const partido of partidos) {
      const mensaje = formatAlertMessage(partido, mensajePatrocinador);
      const idShort = partido.id.replace(/-/g, "");
      const buttonPayload = `quiero_pronostico_${idShort}`;
      const short = (name: string) => name.split(" ")[0].slice(0, 20);

      console.log(`[alertas] ${partido.equipo_local} vs ${partido.equipo_visitante} | ${usuarios.length} usuarios | ventana: ${idsConVentana.size}`);

      const envios = (usuarios as Array<{ id: string; phone: string }>).map(async (user) => {
        const tieneVentana = idsConVentana.has(user.id);

        try {
          let ok = false;

          if (tieneVentana) {
            // Ventana abierta: texto gratis + botón interactivo
            const [r1, r2] = await Promise.all([
              sendWhatsAppText({
                accessToken: WHATSAPP_TOKEN,
                phoneNumberId: PHONE_NUMBER_ID,
                to: user.phone,
                body: mensaje,
              }),
              sendWhatsAppReplyButtons({
                accessToken: WHATSAPP_TOKEN,
                phoneNumberId: PHONE_NUMBER_ID,
                to: user.phone,
                body: `¿Cómo crees que quede? 🎯`,
                buttons: [
                  { id: `prono_L_100_${idShort}`, title: short(partido.equipo_local) },
                  { id: `prono_E_100_${idShort}`, title: "Empate" },
                  { id: `prono_V_100_${idShort}`, title: short(partido.equipo_visitante) },
                ],
                footer: "🎮 Solo entretenimiento · Sin dinero real",
              }),
            ]);
            ok = r1.ok;
            usaronVentana++;
          } else if (ALERT_TEMPLATE_NAME) {
            // Sin ventana: template (cobrado)
            const r = await sendWhatsAppTemplate({
              accessToken: WHATSAPP_TOKEN,
              phoneNumberId: PHONE_NUMBER_ID,
              to: user.phone,
              templateName: ALERT_TEMPLATE_NAME,
              bodyParams: buildTemplateParams(partido, mensajePatrocinador),
              buttonPayload,
            });
            ok = r.ok;
            usaronTemplate++;
          } else {
            // Sin template configurado: texto plano
            const r = await sendWhatsAppText({
              accessToken: WHATSAPP_TOKEN,
              phoneNumberId: PHONE_NUMBER_ID,
              to: user.phone,
              body: mensaje,
            });
            ok = r.ok;
          }

          if (ok) {
            await supabase.from("registros_whatsapp").insert({
              user_id: user.id,
              partido_id: partido.id,
              tipo_mensaje: "alerta_partido",
            });
            totalEnviadas++;
          } else {
            totalFallidas++;
          }
        } catch (e) {
          totalFallidas++;
          erroresEnvio.push(`${user.phone}: ${String(e).slice(0, 80)}`);
        }
      });

      await Promise.allSettled(envios);

      await supabase
        .from("partidos")
        .update({ alerta_enviada: true })
        .eq("id", partido.id);
    }

    return NextResponse.json({
      ok: true,
      enviadas: totalEnviadas,
      fallidas: totalFallidas,
      ventana_gratis: usaronVentana,
      template_pagado: usaronTemplate,
      partidos: partidos.length,
      errores: erroresEnvio.slice(0, 5),
    });
  } catch (err) {
    console.error("Cron alertas error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "cron/alertas activo" });
}
