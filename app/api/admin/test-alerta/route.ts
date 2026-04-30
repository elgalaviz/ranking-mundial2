import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { sendWhatsAppText } from "@/lib/ai/sendWhatsAppText";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "rene.galaviz@gmail.com";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const ADMIN_PHONE = process.env.ADMIN_PHONE || "";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function formatAlertMessage(partido: Record<string, string>, patrocinador: string | null): string {
  const fecha = new Date(partido.fecha_utc).toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });

  const fechaUTC = new Date(partido.fecha_utc).toISOString().replace("T", " ").slice(0, 16) + " UTC";

  let msg = `🧪 *[PRUEBA]* ⚽ *¡En 15 minutos arranca!*\n\n`;
  msg += `🆚 *${partido.equipo_local}* vs *${partido.equipo_visitante}*\n`;
  if (partido.estadio) msg += `🏟 ${partido.estadio}\n`;
  if (partido.ciudad) msg += `📍 ${partido.ciudad}\n`;
  msg += `🕐 ${fecha} hrs CDMX\n`;
  msg += `🗄 DB: ${fechaUTC}\n`;
  if (partido.fase) msg += `\n🏆 ${partido.fase}${partido.grupo ? ` · Grupo ${partido.grupo}` : ""}`;
  if (patrocinador) msg += `\n\n${patrocinador}`;

  return msg;
}

export async function POST(req: NextRequest) {
  const auth = await createServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ADMIN_PHONE) {
    return NextResponse.json({ error: "ADMIN_PHONE no configurado en .env.local" }, { status: 500 });
  }

  const { partido_id } = await req.json();
  if (!partido_id) {
    return NextResponse.json({ error: "partido_id requerido" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: partido, error } = await supabase
    .from("partidos")
    .select("*")
    .eq("id", partido_id)
    .single();

  if (error || !partido) {
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  }

  const { data: patrocinador } = await supabase
    .from("patrocinadores")
    .select("mensaje_texto")
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  const mensaje = formatAlertMessage(partido, patrocinador?.mensaje_texto || null);

  const result = await sendWhatsAppText({
    accessToken: WHATSAPP_TOKEN,
    phoneNumberId: PHONE_NUMBER_ID,
    to: ADMIN_PHONE,
    body: mensaje,
  });

  if (!result.ok) {
    return NextResponse.json({ error: "Error enviando WhatsApp", detail: result }, { status: 500 });
  }

  return NextResponse.json({ ok: true, enviado_a: ADMIN_PHONE });
}
