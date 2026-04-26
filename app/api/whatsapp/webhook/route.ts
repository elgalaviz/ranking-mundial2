import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { sendWhatsAppText } from "@/lib/ai/sendWhatsAppText";
import { sendWhatsAppReplyButtons } from "@/lib/ai/sendWhatsAppInteractive";
import { getSystemPrompt } from "@/lib/ai/systemPrompt";
import { tools, getPartidos, getMomios } from "@/lib/ai/tools";
import { getWorldCupOdds, findEventByTeam } from "@/lib/odds/client";
import { welcomeMessage, limitReachedMessage, pronoGuardadoMessage } from "@/lib/fanbot/messages";

export const runtime = "nodejs";

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rankingmundial26.com";
const PRONO_SPONSOR = process.env.PRONO_SPONSOR || "";
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

    // --- Respuesta de pronóstico (no cuenta como consulta) ---
    if (text.startsWith("prono_") && text.split("_").length === 4) {
      const [, outcome, momio100Str, idShort] = text.split("_");
      const momio = parseInt(momio100Str) / 100;
      const partidoId = [
        idShort.slice(0, 8), idShort.slice(8, 12),
        idShort.slice(12, 16), idShort.slice(16, 20), idShort.slice(20),
      ].join("-");

      const { data: partido } = await supabase
        .from("partidos")
        .select("id, equipo_local, equipo_visitante, fecha_utc, goles_local, goles_visitante")
        .eq("id", partidoId)
        .single();

      if (!partido) {
        await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: "No encontré ese partido. 😕" });
        return new NextResponse("ok", { status: 200 });
      }

      if (new Date(partido.fecha_utc) < new Date()) {
        await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: "⏱️ Ese partido ya comenzó, solo se puede pronosticar antes del pitazo inicial." });
        return new NextResponse("ok", { status: 200 });
      }

      const { data: existing } = await supabase
        .from("pronosticos")
        .select("id, pronostico")
        .eq("whatsapp_id", waId)
        .eq("equipo_local", partido.equipo_local)
        .eq("equipo_visitante", partido.equipo_visitante)
        .maybeSingle();

      if (existing) {
        const labels: Record<string, string> = { local: partido.equipo_local, empate: "Empate", visitante: partido.equipo_visitante };
        await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: `Ya tienes guardado: *${labels[existing.pronostico]}*. ¡Suerte! ⚽` });
        return new NextResponse("ok", { status: 200 });
      }

      const pronostico = outcome === "L" ? "local" : outcome === "E" ? "empate" : "visitante";
      const equipoElegido = outcome === "L" ? partido.equipo_local : outcome === "E" ? "Empate" : partido.equipo_visitante;

      await supabase.from("pronosticos").insert({
        whatsapp_id: waId,
        equipo_local: partido.equipo_local,
        equipo_visitante: partido.equipo_visitante,
        pronostico,
        momio,
        fecha_partido: partido.fecha_utc,
      });

      await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: pronoGuardadoMessage(equipoElegido, momio, 200, PRONO_SPONSOR) });
      return new NextResponse("ok", { status: 200 });
    }

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
    if (incomingText === "sí" || incomingText === "si" || incomingText === "sí alertas" || incomingText === "si alertas" || incomingText === "quiero alertas") {
      await supabase.from("users").update({ alertas_activas: true }).eq("whatsapp_id", waId);
      await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: "✅ *¡Listo!* Te avisaré 15 minutos antes de cada partido. ⚽" });
      return new NextResponse("ok", { status: 200 });
    }
    if (incomingText === "no" || incomingText === "no alertas" || incomingText === "sin alertas" || incomingText === "no quiero alertas") {
      await supabase.from("users").update({ alertas_activas: false }).eq("whatsapp_id", waId);
      await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: "👍 Entendido, no te mandaré alertas de partidos. ⚽" });
      return new NextResponse("ok", { status: 200 });
    }
    if (incomingText === "mis pronósticos" || incomingText === "mis pronosticos" || incomingText === "mis predicciones") {
      const { data: pronos } = await supabase
        .from("pronosticos")
        .select("equipo_local, equipo_visitante, pronostico, momio, acerto, fecha_partido")
        .eq("whatsapp_id", waId)
        .order("fecha_partido", { ascending: true });

      if (!pronos || pronos.length === 0) {
        await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: "Aún no tienes pronósticos guardados. Pregúntame por un partido y te mando los botones para pronosticar. ⚽" });
        return new NextResponse("ok", { status: 200 });
      }

      const labels: Record<string, string> = { local: "🏠 Local", empate: "🤝 Empate", visitante: "✈️ Visitante" };
      const estado = (acerto: boolean | null) => acerto === null ? "⏳ Pendiente" : acerto ? "✅ Acertaste" : "❌ Fallaste";
      const lineas = pronos.map(p =>
        `${p.equipo_local} vs ${p.equipo_visitante}\n  Pronóstico: ${labels[p.pronostico]} (${p.momio}x) — ${estado(p.acerto)}`
      ).join("\n\n");

      const acertados = pronos.filter(p => p.acerto === true).length;
      const total = pronos.filter(p => p.acerto !== null).length;
      const resumen = total > 0 ? `\n\n🏆 Aciertos: ${acertados}/${total}` : "";

      await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: `🎯 *Mis Pronósticos*\n\n${lineas}${resumen}` });
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
      await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: "🔔 ¿Quieres que te avise *15 minutos antes* de cada partido?\n\nResponde:\n✅ *Sí*\n❌ *No*" });
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
        // El modelo solo genera la pregunta y respuestas — nosotros asignamos los IDs
        // para evitar que el modelo mezcle cuál es correcta e incorrecta.
        const triviaPrompt = `Genera una trivia de fútbol sobre la Selección Mexicana. Dificultad media. Devuelve SOLO este JSON (sin texto extra):
{
  "pregunta": "¿La pregunta aquí? (máx 120 caracteres)",
  "correcta": "Respuesta correcta (máx 18 caracteres)",
  "incorrecta_1": "Opción falsa 1 (máx 18 caracteres)",
  "incorrecta_2": "Opción falsa 2 (máx 18 caracteres)"
}`;
        const footer = `Trivia patrocinada por: ${sponsor}`;
        try {
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
          const triviaResp = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
              { role: "system", content: "Eres un generador de trivias de fútbol. Responde solo con el JSON solicitado." },
              { role: "user", content: triviaPrompt },
            ],
            response_format: { type: "json_object" },
          });
          const t = JSON.parse(triviaResp.choices[0].message.content || "{}");
          if (!t.pregunta || !t.correcta || !t.incorrecta_1 || !t.incorrecta_2) throw new Error("JSON incompleto");

          // Asignamos IDs nosotros y mezclamos el orden aleatoriamente
          const opciones = [
            { id: "trivia_correcta",    title: String(t.correcta).slice(0, 18) },
            { id: "trivia_incorrecta_a", title: String(t.incorrecta_1).slice(0, 18) },
            { id: "trivia_incorrecta_b", title: String(t.incorrecta_2).slice(0, 18) },
          ].sort(() => Math.random() - 0.5);

          const body = `Has alcanzado tu límite de mensajes gratuitos. ¡Si aciertas la trivia, ganas 3 mensajes más!\n\n*${t.pregunta}*`;
          await sendWhatsAppReplyButtons({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body, buttons: opciones, footer });
        } catch (e) {
          console.error("❌ Error en trivia IA, usando fallback:", e);
          const opciones = [
            { id: "trivia_correcta",    title: "Javier Hernández" },
            { id: "trivia_incorrecta_a", title: "Hugo Sánchez" },
            { id: "trivia_incorrecta_b", title: "Cuauhtémoc Blanco" },
          ].sort(() => Math.random() - 0.5);
          const body = `Has alcanzado tu límite de mensajes gratuitos. ¡Si aciertas la trivia, ganas 3 mensajes más!\n\n*¿Quién es el máximo goleador histórico de la Selección Mexicana?* ⚽`;
          await sendWhatsAppReplyButtons({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body, buttons: opciones, footer });
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

    // Datos del partido próximo para mostrar botones de pronóstico
    let pronoMatch: { id: string; equipo_local: string; equipo_visitante: string } | null = null;

    if (responseMessage.tool_calls) {
      messages.push(responseMessage);
      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.type === "function" && toolCall.function.name === "getPartidos") {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await getPartidos(args.equipo);
          console.log(`🛠️ getPartidos(${args.equipo || "todos"}) →`, result.slice(0, 120));
          messages.push({ tool_call_id: toolCall.id, role: "tool", content: result });

          // Buscar el próximo partido sin resultado para los botones de pronóstico
          if (args.equipo) {
            const { data: next } = await supabase
              .from("partidos")
              .select("id, equipo_local, equipo_visitante, fecha_utc")
              .or(`equipo_local.ilike.%${args.equipo}%,equipo_visitante.ilike.%${args.equipo}%`)
              .is("goles_local", null)
              .gt("fecha_utc", new Date().toISOString())
              .order("fecha_utc", { ascending: true })
              .limit(1)
              .maybeSingle();
            if (next) pronoMatch = { id: next.id, equipo_local: next.equipo_local, equipo_visitante: next.equipo_visitante };
          }
        } else if (toolCall.type === "function" && toolCall.function.name === "getMomios") {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await getMomios(args.equipo);
          console.log(`🛠️ getMomios(${args.equipo || "todos"}) →`, result.slice(0, 120));
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

    const sinDatos = parsed.no_data === true;

    if (parsed.type === "buttons" && parsed.buttons) {
      await sendWhatsAppReplyButtons({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: parsed.body, buttons: parsed.buttons });
    } else {
      await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: parsed.body || reply });
    }

    // --- Botones de pronóstico (si el mensaje fue sobre un partido próximo) ---
    if (pronoMatch) {
      try {
        const events = await getWorldCupOdds();
        const event = findEventByTeam(events, pronoMatch.equipo_local);
        if (event) {
          const h2h = event.bookmakers[0]?.markets.find((m) => m.key === "h2h");
          const outcomes = h2h?.outcomes ?? [];
          const homeOdds = outcomes.find((o) => o.name === event.home_team);
          const awayOdds = outcomes.find((o) => o.name === event.away_team);
          const drawOdds = outcomes.find((o) => o.name === "Draw");

          if (homeOdds && awayOdds && drawOdds) {
            const idShort = pronoMatch.id.replace(/-/g, "");
            const short = (name: string) => name.split(" ")[0].slice(0, 9);
            const buttons = [
              { id: `prono_L_${Math.round(homeOdds.price * 100)}_${idShort}`, title: `${short(pronoMatch.equipo_local)} ${homeOdds.price.toFixed(2)}x`.slice(0, 20) },
              { id: `prono_E_${Math.round(drawOdds.price * 100)}_${idShort}`, title: `Empate ${drawOdds.price.toFixed(2)}x`.slice(0, 20) },
              { id: `prono_V_${Math.round(awayOdds.price * 100)}_${idShort}`, title: `${short(pronoMatch.equipo_visitante)} ${awayOdds.price.toFixed(2)}x`.slice(0, 20) },
            ];
            await sendWhatsAppReplyButtons({
              accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from,
              body: `¿Cómo crees que quede ${pronoMatch.equipo_local} vs ${pronoMatch.equipo_visitante}? 🎯`,
              buttons,
              footer: "🎮 Solo entretenimiento · Sin dinero real",
            });
          }
        }
      } catch (e) {
        console.error("Error al enviar botones de pronóstico:", e);
      }
    }

    // Incrementar contador solo si el bot tuvo información que dar
    if (!sinDatos) {
      await supabase.from("users").update({ consultas_hoy: consultasHoy + 1 }).eq("id", user.id);
    }
    await supabase.from("registros_whatsapp").insert({ user_id: user.id, tipo_mensaje: "chatbot" });

    return new NextResponse("ok", { status: 200 });
  } catch (err) {
    console.error("FanBot webhook error:", err);
    return new NextResponse("ok", { status: 200 });
  }
}
