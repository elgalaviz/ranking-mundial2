import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppTemplate } from "@/lib/ai/sendWhatsAppInteractive";
import { sendWhatsAppText } from "@/lib/ai/sendWhatsAppText";

export const runtime = "nodejs";

const CRON_SECRET = process.env.CRON_SECRET || "";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const ALERT_TEMPLATE_NAME = process.env.ALERT_TEMPLATE_NAME || "";
const ADMIN_PHONE = process.env.ADMIN_PHONE || "";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!CRON_SECRET || !secret || secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ADMIN_PHONE) {
    return NextResponse.json({ error: "ADMIN_PHONE no configurado" }, { status: 500 });
  }

  const supabase = getSupabase();

  // Tomar el próximo partido real de la DB
  const { data: partido } = await supabase
    .from("partidos")
    .select("*")
    .gte("fecha_utc", new Date().toISOString())
    .order("fecha_utc", { ascending: true })
    .limit(1)
    .single();

  if (!partido) {
    return NextResponse.json({ error: "No hay partidos próximos en la DB" }, { status: 404 });
  }

  const { data: pat } = await supabase
    .from("patrocinadores")
    .select("mensaje_texto")
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  const patrocinador = pat?.mensaje_texto || null;
  const idShort = partido.id.replace(/-/g, "");
  const buttonPayload = `quiero_pronostico_${idShort}`;

  let result;
  if (ALERT_TEMPLATE_NAME) {
    result = await sendWhatsAppTemplate({
      accessToken: WHATSAPP_TOKEN,
      phoneNumberId: PHONE_NUMBER_ID,
      to: ADMIN_PHONE,
      templateName: ALERT_TEMPLATE_NAME,
      bodyParams: [
        partido.equipo_local,
        partido.equipo_visitante,
        partido.estadio || "",
        partido.ciudad || "",
        partido.grupo ? `Grupo ${partido.grupo}` : (partido.fase || ""),
        patrocinador || "",
        partido.canales || "",
      ],
      buttonPayload,
    });
  } else {
    const fecha = new Date(partido.fecha_utc).toLocaleTimeString("es-MX", {
      timeZone: "America/Mexico_City",
      hour: "2-digit",
      minute: "2-digit",
    });
    let msg = `⚽ *[TEST] ¡En 15 minutos arranca!*\n\n`;
    msg += `🆚 *${partido.equipo_local}* vs *${partido.equipo_visitante}*\n`;
    msg += `🕐 ${fecha} hora CDMX\n`;
    if (partido.estadio) msg += `🏟 ${partido.estadio}\n`;
    if (partido.canales) msg += `📺 ${partido.canales}`;
    result = await sendWhatsAppText({
      accessToken: WHATSAPP_TOKEN,
      phoneNumberId: PHONE_NUMBER_ID,
      to: ADMIN_PHONE,
      body: msg,
    });
  }

  return NextResponse.json({
    ok: result.ok,
    partido: `${partido.equipo_local} vs ${partido.equipo_visitante}`,
    fecha_utc: partido.fecha_utc,
    enviado_a: ADMIN_PHONE,
  });
}
