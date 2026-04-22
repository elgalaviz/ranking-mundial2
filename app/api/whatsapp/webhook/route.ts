import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { sendWhatsAppText } from "@/lib/ai/sendWhatsAppText";
import { sendWhatsAppReplyButtons } from "@/lib/ai/sendWhatsAppInteractive";
import { getSystemPrompt } from "@/lib/ai/systemPrompt";
import { tools, getPartidos } from "@/lib/ai/tools";
import { welcomeMessage, limitReachedMessage } from "@/lib/fanbot/messages";

export const runtime = "nodejs";

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rankingmundial26.com";
const MAX_FREE_QUERIES = 5;

const MATCH_TRIGGERS = [
  'partido', 'juego', 'juega', 'jugará', 'jugaran', 'fecha', 'horario',
  'estadio', 'grupo', 'cuándo', 'cuando', 'primer', 'próximo', 'proximo',
  'resultado', 'marcador', 'jornada', 'fase',
];

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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

async function resetDailyIfNeeded(
  supabase: ReturnType<typeof getSupabase>,
  userId: string,
  resetDate: string | null
): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];
  if (resetDate !== today) {
    await supabase
      .from("users")
      .update({ consultas_hoy: 0, consultas_reset: today, jugo_trivia_hoy: false, consultas_extra_hoy: 0 })
      .eq("id", userId);
    return true;
  }
  return false;
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

    // Extraer texto del mensaje (normal o botón interactivo)
    let text: string;
    if (message.type === "interactive") {
      const iType = message.interactive?.type;
      if (iType === "button_reply") text = message.interactive.button_reply.id;
      else if (iType === "list_reply") text = message.interactive.list_reply.id;
      else return new NextResponse("ok", { status: 200 });
    } else if (message.type === "text") {
      text = (message.text?.body || "").trim();
    } else {
      return new NextResponse("ok", { status: 200 });
    }

    if (!text) return new NextResponse("ok", { status: 200 });
    const incomingText = text.toLowerCase();
    console.log(`📩 Mensaje de ${from} (${profileName}): "${text}"`);

    // --- Respuesta de trivia ---
    if (text === "trivia_correcta" || text.startsWith("trivia_incorrecta")) {
      const { data: u } = await supabase
        .from("users")
        .select("id, jugo_trivia_hoy")
        .eq("whatsapp_id", waId)
        .single();
      if (u && !u.jugo_trivia_hoy) {
        const { data: pat } = await supabase.from("patrocinadores").select("nombre").eq("activo", true).limit(1).maybeSingle();
        const sponsor = pat?.nombre || "nuestros amigos";
        let msg: string;
        if (text === "trivia_correcta") {
          await supabase.from("users").update({ consultas_extra_hoy: 3, jugo_trivia_hoy: true }).eq("id", u.id);
          msg = `¡Correcto! Eres un verdadero fan. 🥳 Has ganado 3 consultas extra para hoy, patrocinado por ${sponsor}. ¿En qué más te puedo ayudar?`;
        } else {
          await supabase.from("users").update({ jugo_trivia_hoy: true }).eq("id", u.id);
          msg = `¡Casi! Esa no era la respuesta. 😕 Gracias por participar en la trivia de ${sponsor}. ¡Nos vemos mañana!`;
        }
        await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: msg });
      }
      return new NextResponse("ok", { status: 200 });
    }

    // --- Comandos especiales (no cuentan contra el límite) ---
    if (incomingText === "sí alertas" || incomingText === "si alertas" || incomingText === "quiero alertas") {
      await supabase.from("users").update({ alertas_activas: true }).eq("whatsapp_id", waId);
      await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: "✅ *¡Listo!* Te avisaré 15 minutos antes de cada partido. ⚽" });
      return new NextResponse("ok", { status: 200 });
    }
    if (incomingText === "no alertas" || incomingText === "sin alertas" || incomingText === "no quiero alertas") {
      await supabase.from("users").update({ alertas_activas: false }).eq("whatsapp_id", waId);
      await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: "👍 Entendido, no te mandaré alertas de partidos. ⚽" });
      return new NextResponse("ok", { status: 200 });
    }
    if (incomingText === "baja" || incomingText === "stop") {
      await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: "⚠️ ¿Confirmas que quieres eliminar tu cuenta y todos tus datos?\n\nResponde *CONFIRMAR BAJA* para proceder.\n\nSi fue un error, ignora este mensaje." });
      return new NextResponse("ok", { status: 200 });
    }
    if (incomingText === "confirmar baja") {
      await supabase.from("users").delete().eq("whatsapp_id", waId);
      await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: "👋 Tu cuenta y datos han sido eliminados. ¡Gracias por acompañarnos!" });
      return new NextResponse("ok", { status: 200 });
    }

    // --- Buscar o crear usuario ---
    let { data: user } = await supabase.from("users").select("*").eq("whatsapp_id", waId).single();
    const { country_code, city_hint } = inferCountry(from);

    if (!user) {
      const { data: created } = await supabase
        .from("users")
        .insert({ whatsapp_id: waId, phone: from, name: profileName, country_code, city_hint })
        .select()
        .single();
      user = created;
      await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: welcomeMessage(profileName) });
      await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: "🔔 ¿Quieres que te avise *15 minutos antes* de cada partido?\n\nResponde:\n✅ *Sí alertas*\n❌ *No alertas*" });
      await supabase.from("registros_whatsapp").insert({ user_id: user.id, tipo_mensaje: "bienvenida" });
      return new NextResponse("ok", { status: 200 });
    }

    // --- Resetear contadores si cambió el día ---
    const wasReset = await resetDailyIfNeeded(supabase, user.id, user.consultas_reset);
    const consultasHoy: number = wasReset ? 0 : (user.consultas_hoy ?? 0);
    const jugoTrivia: boolean = wasReset ? false : (user.jugo_trivia_hoy ?? false);
    const consultasExtra: number = wasReset ? 0 : (user.consultas_extra_hoy ?? 0);
    const limiteDiario = MAX_FREE_QUERIES + consultasExtra;

    console.log(`📊 ${from} — consultas: ${consultasHoy}/${limiteDiario} | trivia: ${jugoTrivia} | plan: ${user.plan}`);

    // --- Verificar límite ---
    if (user.plan !== "premium" && consultasHoy >= limiteDiario) {
      if (!jugoTrivia) {
        // Ofrecer trivia
        const { data: pat } = await supabase.from("patrocinadores").select("nombre").eq("activo", true).limit(1).maybeSingle();
        const sponsor = pat?.nombre || "nuestros amigos";
        const triviaPrompt = `Genera una trivia de opción múltiple sobre la Selección Mexicana de Fútbol. Dificultad media. La respuesta correcta tiene id 'trivia_correcta'. Las dos incorrectas tienen ids ÚNICOS: 'trivia_incorrecta_a' y 'trivia_incorrecta_b'. Orden aleatorio. Solo devuelve el JSON:
{
  "body": "Has alcanzado tu límite de mensajes gratuitos. ¡Una trivia patrocinada por ${sponsor}: si aciertas, ganas 3 mensajes más!\\n\\n*AQUÍ LA PREGUNTA*",
  "buttons": [
    {"id": "trivia_incorrecta_a", "title": "Opción incorrecta A"},
    {"id": "trivia_correcta", "title": "Opción correcta"},
    {"id": "trivia_incorrecta_b", "title": "Opción incorrecta B"}
  ]
}`;
        try {
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
          const triviaResp = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
              { role: "system", content: "Genera trivias de fútbol en formato JSON." },
              { role: "user", content: triviaPrompt },
            ],
            response_format: { type: "json_object" },
          });
          const triviaJson = JSON.parse(triviaResp.choices[0].message.content || "{}");
          if (triviaJson.body && triviaJson.buttons) {
            await sendWhatsAppReplyButtons({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: triviaJson.body, buttons: triviaJson.buttons });
          } else {
            throw new Error("JSON de trivia inválido");
          }
        } catch (e) {
          console.error("❌ Error en trivia IA, usando fallback:", e);
          const fallbackBody = `Has alcanzado tu límite de mensajes gratuitos. ¡Una trivia patrocinada por ${sponsor}: si aciertas, ganas 3 mensajes más!\n\n*¿Quién es el máximo goleador histórico de la Selección Mexicana?* ⚽`;
          await sendWhatsAppReplyButtons({
            accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from,
            body: fallbackBody,
            buttons: [
              { id: "trivia_correcta", title: "Javier Hernández" },
              { id: "trivia_incorrecta_a", title: "Hugo Sánchez" },
              { id: "trivia_incorrecta_b", title: "Cuauhtémoc Blanco" },
            ],
          });
        }
      } else {
        // Ya jugó trivia — ofrecer premium
        await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: limitReachedMessage(APP_URL) });
      }
      return new NextResponse("ok", { status: 200 });
    }

    // --- Generar respuesta con IA ---
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const systemPrompt = getSystemPrompt({ contacto: { name: user.name } });
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ];

    const forceMatchTool = MATCH_TRIGGERS.some((kw) => incomingText.includes(kw));
    const toolChoice = forceMatchTool
      ? ({ type: "function", function: { name: "getPartidos" } } as const)
      : ("auto" as const);

    if (forceMatchTool) console.log("🛠️ Forzando herramienta getPartidos");

    let aiResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      tools,
      tool_choice: toolChoice,
    });

    let responseMessage = aiResponse.choices[0].message;

    if (responseMessage.tool_calls) {
      messages.push(responseMessage);
      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.type === "function" && toolCall.function.name === "getPartidos") {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await getPartidos(args.equipo);
          console.log(`🛠️ getPartidos(${args.equipo || "todos"}) →`, result.slice(0, 120));
          messages.push({ tool_call_id: toolCall.id, role: "tool", content: result });
        }
      }
      const secondResponse = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages,
      });
      responseMessage = secondResponse.choices[0].message;
    }

    const reply = responseMessage.content || "No pude procesar tu solicitud. Intenta de nuevo. ⚽";

    // Enviar como texto o como botones interactivos
    let parsed: any;
    try { parsed = JSON.parse(reply); } catch { parsed = { body: reply }; }

    if (parsed.type === "buttons" && parsed.buttons) {
      await sendWhatsAppReplyButtons({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: parsed.body, buttons: parsed.buttons });
    } else {
      await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: parsed.body || reply });
    }

    // Incrementar contador DESPUÉS de responder
    await supabase.from("users").update({ consultas_hoy: consultasHoy + 1 }).eq("id", user.id);
    await supabase.from("registros_whatsapp").insert({ user_id: user.id, tipo_mensaje: "chatbot" });

    return new NextResponse("ok", { status: 200 });
  } catch (err) {
    console.error("FanBot webhook error:", err);
    return new NextResponse("ok", { status: 200 });
  }
}
