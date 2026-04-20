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

    // Detectar intención de baja
    if (incomingText === "stop" || incomingText === "baja") {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("whatsapp_id", waId);

      if (!error) {
        await sendWhatsAppText({
          accessToken: WHATSAPP_TOKEN,
          phoneNumberId: PHONE_NUMBER_ID,
          to: from,
          body: "⚽ *Ranking Mundial 26*\n\nTu registro ha sido cancelado exitosamente y tus datos han sido eliminados de nuestro sistema.\n\nYa no recibirás más alertas ni mensajes de nuestra parte. ¡Gracias por habernos acompañado! 👋",
        });
      }
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
