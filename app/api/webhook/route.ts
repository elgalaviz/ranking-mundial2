import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// ENV
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Supabase admin
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// =========================
// VERIFY (GET)
// =========================
export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Error de verificación", { status: 403 });
}

// =========================
// WEBHOOK (POST)
// =========================
export async function POST(req: NextRequest) {
  try {
    console.log("🔥 WEBHOOK HIT");

    const body = await req.json();

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    const message = value?.messages?.[0];

    if (!message) {
      return new NextResponse("No message", { status: 200 });
    }

    // 🔥 FIX IMPORTANTE (blindado)
    const phoneNumberId = String(
      value?.metadata?.phone_number_id || ""
    ).trim();

    console.log("📞 phoneNumberId:", phoneNumberId);

    const from = message.from;
    const messageId = message.id;
    const text = message.text?.body || "";

    // =========================
    // 1. MAPEAR A NEGOCIO
    // =========================
    const { data: waAccount, error: waError } = await supabase
      .from("whatsapp_accounts")
      .select("business_id")
      .eq("phone_number_id", phoneNumberId)
      .maybeSingle();

    console.log("🏢 waAccount:", waAccount);

    if (waError) {
      console.error("Error buscando WA account:", waError);
      return new NextResponse("ok", { status: 200 });
    }

    if (!waAccount?.business_id) {
      console.error("❌ Número no vinculado:", phoneNumberId);
      return new NextResponse("ok", { status: 200 });
    }

    const businessId = waAccount.business_id;

    // =========================
    // 2. EVITAR DUPLICADOS
    // =========================
    const { error: insertError } = await supabase
      .from("mensajes_recibidos")
      .insert({
        whatsapp: from,
        texto: text,
        tipo: "cliente",
        message_id: messageId,
        business_id: businessId,
      });

    if (insertError) {
      console.log("⚠️ Mensaje duplicado:", messageId);
      return new NextResponse("ok", { status: 200 });
    }

    console.log("💾 mensaje guardado");

    // =========================
    // 3. BUSCAR O CREAR CONTACTO
    // =========================
    const { data: contacto } = await supabase
      .from("contactos")
      .select("*")
      .eq("business_id", businessId)
      .eq("whatsapp", from)
      .maybeSingle();

    if (!contacto) {
      await supabase.from("contactos").insert({
        whatsapp: from,
        business_id: businessId,
        estado: "nuevo",
      });

      console.log("👤 contacto creado");
    }

    // =========================
    // 4. RESPUESTA IA (simple)
    // =========================
    const respuesta = await generarRespuestaIA(text);

    // =========================
    // 5. GUARDAR RESPUESTA
    // =========================
    await supabase.from("mensajes_recibidos").insert({
      whatsapp: from,
      texto: respuesta,
      tipo: "bot",
      business_id: businessId,
    });

    // =========================
    // 6. ENVIAR WHATSAPP
    // =========================
    await enviarWhatsApp(from, respuesta, phoneNumberId);

    return new NextResponse("ok", { status: 200 });
  } catch (error) {
    console.error("🔥 Webhook error:", error);
    return new NextResponse("error", { status: 500 });
  }
}

// =========================
// IA (mínima)
// =========================
async function generarRespuestaIA(mensaje: string) {
  return `Recibí tu mensaje: "${mensaje}"`;
}

// =========================
// ENVÍO WHATSAPP
// =========================
async function enviarWhatsApp(
  to: string,
  text: string,
  phoneNumberId: string
) {
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      text: { body: text },
    }),
  });
}