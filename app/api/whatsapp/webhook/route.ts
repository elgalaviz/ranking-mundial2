import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { sendWhatsAppText } from "@/lib/ai/sendWhatsAppText";
import { getFanbotSystemPrompt } from "@/lib/fanbot/systemPrompt";
import { welcomeMessage, limitReachedMessage, unknownMessage } from "@/lib/fanbot/messages";

export const runtime = "nodejs";

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const MAX_FREE_QUERIES = 3;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

function inferCountry(phone: string): { country_code: string; city_hint: string } {
  if (phone.startsWith("521") || phone.startsWith("52")) return { country_code: "MX", city_hint: "México" };
  if (phone.startsWith("1")) return { country_code: "US", city_hint: "USA/Canadá" };
  if (phone.startsWith("54")) return { country_code: "AR", city_hint: "Argentina" };
  if (phone.startsWith("55")) return { country_code: "BR", city_hint: "Brasil" };
  if (phone.startsWith("34")) return { country_code: "ES", city_hint: "España" };
  if (phone.startsWith("57")) return { country_code: "CO", city_hint: "Colombia" };
  if (phone.startsWith("56")) return { country_code: "CL", city_hint: "Chile" };
  if (phone.startsWith("51")) return { country_code: "PE", city_hint: "Perú" };
  return { country_code: "XX", city_hint: "Desconocido" };
}

async function resetQueriesIfNeeded(supabase: ReturnType<typeof getSupabase>, userId: string, resetDate: string) {
  const today = new Date().toISOString().split("T")[0];
  if (resetDate !== today) {
    await supabase
      .from("users")
      .update({ consultas_hoy: 0, consultas_reset: today })
      .eq("id", userId);
    return 0;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();

  try {
    console.log("🔔 Webhook invocado /api/whatsapp/webhook");
    const body = await req.json();
    console.log("📦 Body recibido:", JSON.stringify(body, null, 2));

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      console.log("⚠️ No se encontró ningún mensaje en el payload.");
      return new NextResponse("ok", { status: 200 });
    }

    const from: string = message.from;
    const waId: string = value?.contacts?.[0]?.wa_id || from;
    const profileName: string = value?.contacts?.[0]?.profile?.name || "Fan";
    const text: string = (message.text?.body || "").trim();

    console.log(`📩 Mensaje de ${from} (${profileName}): ${text}`);

    if (!text) return new NextResponse("ok", { status: 200 });

    const incomingText = text.toLowerCase();

    // Detectar solicitud de calendario
    if (incomingText.includes("calendario")) {
      await sendWhatsAppText({
        accessToken: WHATSAPP_TOKEN,
        phoneNumberId: PHONE_NUMBER_ID,
        to: from,
        body:
          `📅 *¡Claro, te lo proporciono con gusto!*\n\n` +
          `Aquí está el calendario completo del Mundial 2026 para agregar a Google Calendar o iPhone:\n\n` +
          `${APP_URL}/api/calendario\n\n` +
          `Incluye los 104 partidos con horarios en tu zona horaria. ⚽🏆`,
      });
      return new NextResponse("ok", { status: 200 });
    }

    // Detectar opt-in/opt-out de notificaciones
    if (incomingText === "sí alertas" || incomingText === "si alertas" || incomingText === "quiero alertas") {
      await supabase.from("users").update({ alertas_activas: true }).eq("whatsapp_id", waId);
      await sendWhatsAppText({
        accessToken: WHATSAPP_TOKEN,
        phoneNumberId: PHONE_NUMBER_ID,
        to: from,
        body: `✅ *¡Listo!* Te avisaré 15 minutos antes de cada partido. ⚽`,
      });
      return new NextResponse("ok", { status: 200 });
    }
    if (incomingText === "no alertas" || incomingText === "sin alertas" || incomingText === "no quiero alertas") {
      await supabase.from("users").update({ alertas_activas: false }).eq("whatsapp_id", waId);
      await sendWhatsAppText({
        accessToken: WHATSAPP_TOKEN,
        phoneNumberId: PHONE_NUMBER_ID,
        to: from,
        body: `👍 Entendido, no te mandaré alertas de partidos. Siempre puedes preguntarme lo que quieras aquí. ⚽`,
      });
      return new NextResponse("ok", { status: 200 });
    }

    // Detectar intención de baja — primero pedir confirmación
    if (incomingText === "baja" || incomingText === "stop") {
      await sendWhatsAppText({
        accessToken: WHATSAPP_TOKEN,
        phoneNumberId: PHONE_NUMBER_ID,
        to: from,
        body:
          `⚠️ ¿Confirmas que quieres eliminar tu cuenta y todos tus datos?\n\n` +
          `Responde *CONFIRMAR BAJA* para proceder.\n\n` +
          `Si fue un error, ignora este mensaje.`,
      });
      return new NextResponse("ok", { status: 200 });
    }

    if (incomingText === "confirmar baja") {
      await supabase.from("users").delete().eq("whatsapp_id", waId);
      await sendWhatsAppText({
        accessToken: WHATSAPP_TOKEN,
        phoneNumberId: PHONE_NUMBER_ID,
        to: from,
        body: "👋 Tu cuenta y datos han sido eliminados. ¡Gracias por acompañarnos! Si cambias de opinión, escríbenos cuando quieras.",
      });
      return new NextResponse("ok", { status: 200 });
    }

    const { country_code, city_hint } = inferCountry(from);

    // Buscar o crear usuario
    let { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("whatsapp_id", waId)
      .single();

    const isNew = !user;
    console.log(`👤 Usuario nuevo: ${isNew}`);

    if (isNew) {
      const { data: created } = await supabase
        .from("users")
        .insert({
          whatsapp_id: waId,
          phone: from,
          name: profileName,
          country_code,
          city_hint,
        })
        .select()
        .single();

      user = created;

      console.log("👋 Enviando mensaje de bienvenida...");
      const sendResult = await sendWhatsAppText({
        accessToken: WHATSAPP_TOKEN,
        phoneNumberId: PHONE_NUMBER_ID,
        to: from,
        body: welcomeMessage(profileName),
      });
      console.log("📤 Resultado de envío de bienvenida:", sendResult);

      await supabase.from("registros_whatsapp").insert({
        user_id: user.id,
        tipo_mensaje: "bienvenida",
      });

      // Preguntar opt-in de notificaciones
      await sendWhatsAppText({
        accessToken: WHATSAPP_TOKEN,
        phoneNumberId: PHONE_NUMBER_ID,
        to: from,
        body:
          `🔔 ¿Quieres que te avise *15 minutos antes* de cada partido?\n\n` +
          `Responde:\n` +
          `✅ *Sí alertas*\n` +
          `❌ *No alertas*`,
      });

      return new NextResponse("ok", { status: 200 });
    }

    // Resetear contador si cambió el día
    const queriesAfterReset = await resetQueriesIfNeeded(supabase, user.id, user.consultas_reset);
    const consultasHoy: number = queriesAfterReset ?? user.consultas_hoy;

    console.log(`📊 Consultas hoy: ${consultasHoy} / Límite: ${MAX_FREE_QUERIES}`);

    // Verificar límite
    if (user.plan === "free" && consultasHoy >= MAX_FREE_QUERIES) {
      console.log("🛑 Límite alcanzado, enviando mensaje de límite.");
      const limitResult = await sendWhatsAppText({
        accessToken: WHATSAPP_TOKEN,
        phoneNumberId: PHONE_NUMBER_ID,
        to: from,
        body: limitReachedMessage(),
      });
      console.log("📤 Resultado límite:", limitResult);
      return new NextResponse("ok", { status: 200 });
    }

    // Llamar a OpenAI
    console.log("🤖 Llamando a OpenAI...");
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      max_tokens: 400,
      messages: [
        { role: "system", content: getFanbotSystemPrompt() },
        { role: "user", content: text },
      ],
    });

    const reply = response.choices[0]?.message?.content || unknownMessage();
    console.log("🤖 Respuesta OpenAI generada.");

    const replyResult = await sendWhatsAppText({
      accessToken: WHATSAPP_TOKEN,
      phoneNumberId: PHONE_NUMBER_ID,
      to: from,
      body: reply,
    });
    console.log("📤 Resultado envío OpenAI:", replyResult);

    // Incrementar contador
    await supabase
      .from("users")
      .update({ consultas_hoy: consultasHoy + 1 })
      .eq("id", user.id);

    await supabase.from("registros_whatsapp").insert({
      user_id: user.id,
      tipo_mensaje: "chatbot",
    });

    return new NextResponse("ok", { status: 200 });
  } catch (err) {
    console.error("FanBot webhook error:", err);
    return new NextResponse("ok", { status: 200 });
  }
}
