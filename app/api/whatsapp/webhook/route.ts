import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
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

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.CLAUDE_API_KEY! });
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
    const body = await req.json();
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) return new NextResponse("ok", { status: 200 });

    const from: string = message.from;
    const waId: string = value?.contacts?.[0]?.wa_id || from;
    const profileName: string = value?.contacts?.[0]?.profile?.name || "Fan";
    const text: string = (message.text?.body || "").trim();

    if (!text) return new NextResponse("ok", { status: 200 });

    const { country_code, city_hint } = inferCountry(from);

    // Buscar o crear usuario
    let { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("whatsapp_id", waId)
      .single();

    const isNew = !user;

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

      await sendWhatsAppText({
        accessToken: WHATSAPP_TOKEN,
        phoneNumberId: PHONE_NUMBER_ID,
        to: from,
        body: welcomeMessage(profileName),
      });

      await supabase.from("registros_whatsapp").insert({
        user_id: user.id,
        tipo_mensaje: "bienvenida",
      });

      return new NextResponse("ok", { status: 200 });
    }

    // Resetear contador si cambió el día
    const queriesAfterReset = await resetQueriesIfNeeded(supabase, user.id, user.consultas_reset);
    const consultasHoy: number = queriesAfterReset ?? user.consultas_hoy;

    // Verificar límite
    if (user.plan === "free" && consultasHoy >= MAX_FREE_QUERIES) {
      await sendWhatsAppText({
        accessToken: WHATSAPP_TOKEN,
        phoneNumberId: PHONE_NUMBER_ID,
        to: from,
        body: limitReachedMessage(),
      });
      return new NextResponse("ok", { status: 200 });
    }

    // Llamar a Claude
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: getFanbotSystemPrompt(),
      messages: [{ role: "user", content: text }],
    });

    const reply = (response.content[0] as { type: string; text: string }).text || unknownMessage();

    await sendWhatsAppText({
      accessToken: WHATSAPP_TOKEN,
      phoneNumberId: PHONE_NUMBER_ID,
      to: from,
      body: reply,
    });

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
