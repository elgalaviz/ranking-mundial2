import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppText } from "@/lib/ai/sendWhatsAppText";
import { sendWhatsAppTemplate } from "@/lib/ai/sendWhatsAppInteractive";

export const runtime = "nodejs";

const CRON_SECRET = process.env.CRON_SECRET || "";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const ACTIVAR_TEMPLATE = process.env.ACTIVAR_ALERTAS_TEMPLATE_NAME || "";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabase();
  const { data } = await supabase
    .from("users")
    .select("id, phone, name")
    .is("alertas_activas", null)
    .not("phone", "is", null);
  return NextResponse.json({ usuarios: data || [], total: (data || []).length });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mensaje } = await req.json();
  if (!mensaje?.trim()) {
    return NextResponse.json({ error: "Falta el mensaje" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data: usuarios } = await supabase
    .from("users")
    .select("id, phone, name")
    .is("alertas_activas", null)
    .not("phone", "is", null);

  if (!usuarios || usuarios.length === 0) {
    return NextResponse.json({ ok: true, enviadas: 0, msg: "No hay usuarios sin respuesta" });
  }

  let enviadas = 0;
  let fallidas = 0;

  await Promise.allSettled(
    usuarios.map(async (u) => {
      const result = ACTIVAR_TEMPLATE
        ? await sendWhatsAppTemplate({
            accessToken: WHATSAPP_TOKEN,
            phoneNumberId: PHONE_NUMBER_ID,
            to: u.phone!,
            templateName: ACTIVAR_TEMPLATE,
            bodyParams: [u.name || "fanático"],
            buttonPayloads: ["activar_si", "activar_no"],
          })
        : await sendWhatsAppText({
            accessToken: WHATSAPP_TOKEN,
            phoneNumberId: PHONE_NUMBER_ID,
            to: u.phone!,
            body: mensaje,
          });
      if (result.ok) enviadas++;
      else fallidas++;
    })
  );

  return NextResponse.json({ ok: true, enviadas, fallidas, total: usuarios.length });
}
