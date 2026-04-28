// ⚠️ WEBHOOK LEGACY — NO ACTIVO
// Meta llama /api/whatsapp/webhook (no este endpoint).
// Este archivo está desactualizado. No editar aquí.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSystemPrompt } from "@/lib/ai/systemPrompt";
import { sendWhatsAppText, sendWhatsAppDocument } from "@/lib/ai/sendWhatsAppText";
import { sendWhatsAppReplyButtons } from "@/lib/ai/sendWhatsAppInteractive";
import { tools, getPartidos, getMomios } from "@/lib/ai/tools";
import { limitReachedMessage, pronoGuardadoMessage } from "@/lib/fanbot/messages";
import { getWorldCupOdds } from "@/lib/odds/client";
import OpenAI from "openai";

export const runtime = "nodejs";

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mifanbot.com";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const isSameDayInMX = (d1: Date, d2: Date | null): boolean => {
  if (!d2) return false;
  const tz = "America/Mexico_City";
  const d1Str = d1.toLocaleDateString("en-CA", { timeZone: tz });
  return new Date(d2).toLocaleDateString("en-CA", { timeZone: tz }) === d1Str;
};

function normalizeStr(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Traducciones básicas español → inglés para buscar en The Odds API
const TEAM_TRANSLATIONS: Record<string, string> = {
  "espana": "spain", "alemania": "germany", "francia": "france",
  "brasil": "brazil", "estados unidos": "united states", "ee.uu.": "united states",
  "holanda": "netherlands", "paises bajos": "netherlands",
  "corea del sur": "south korea", "arabia saudita": "saudi arabia",
  "costa de marfil": "ivory coast", "suiza": "switzerland",
  "belgica": "belgium", "portugal": "portugal", "croacia": "croatia",
  "senegal": "senegal", "marruecos": "morocco",
};

function findEventByTeamNormalized(
  events: Awaited<ReturnType<typeof getWorldCupOdds>>,
  team: string
) {
  const t = normalizeStr(team);
  const tEn = TEAM_TRANSLATIONS[t] || t;
  return events.find((e) => {
    const home = normalizeStr(e.home_team);
    const away = normalizeStr(e.away_team);
    return home.includes(t) || away.includes(t) || home.includes(tEn) || away.includes(tEn);
  }) ?? null;
}

const PURE_SALUDOS = new Set([
  "hola", "hola!", "buenos dias", "buenos días", "buenas tardes",
  "buenas noches", "buenas", "hey", "ey", "ola", "q tal", "que tal",
  "qué tal", "buen dia", "buen día", "saludos", "holi", "hello",
]);

function esPuraSaludo(text: string): boolean {
  const norm = normalizeStr(text).replace(/[!¡?¿.,]/g, "").trim();
  return PURE_SALUDOS.has(norm);
}

const AFIRMATIVOS = new Set([
  "si", "sí", "yes", "dale", "claro", "por supuesto", "ok", "okay",
  "va", "adelante", "orale", "órale", "andale", "ándale", "quiero",
  "quiero alertas", "activa", "activame", "activame las alertas",
]);

const NEGATIVOS = new Set([
  "no", "nel", "nope", "no gracias", "no quiero", "nah", "paso",
]);

function normText(text: string): string {
  return normalizeStr(text).replace(/[!¡?¿.,]/g, "").trim();
}

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

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  try {
    const body = await req.json();
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return new NextResponse("ok", { status: 200 });
    }

    const phoneNumberId = String(value?.metadata?.phone_number_id || "").trim();
    const from = message.from;
    const accessToken = process.env.WHATSAPP_TOKEN || "";
    const business_id = process.env.WHATSAPP_BUSINESS_ID || "ranking-mundial";

    if (!accessToken) {
      console.error("❌ Falta WHATSAPP_TOKEN en .env");
      return new NextResponse("ok", { status: 200 });
    }

    // Extraer texto del mensaje (normal o interactivo)
    let text: string;
    if (message.type === "interactive") {
      const iType = message.interactive.type;
      if (iType === "button_reply") {
        text = message.interactive.button_reply.id;
      } else if (iType === "list_reply") {
        text = message.interactive.list_reply.id;
      } else {
        return new NextResponse("ok", { status: 200 });
      }
    } else if (message.type === "text") {
      text = message.text?.body || "";
    } else {
      return new NextResponse("ok", { status: 200 });
    }

    const profileName = value?.contacts?.[0]?.profile?.name || null;
    console.log(`💬 ${from} (${profileName || "sin nombre"}): "${text}"`);

    // ── 1. RESPUESTA DE TRIVIA ────────────────────────────────────────
    if (text === "trivia_correcta" || text.startsWith("trivia_incorrecta")) {
      const { data: contactoTrivia } = await supabase
        .from("users")
        .select("id, jugo_trivia_hoy")
        .eq("phone", from)
        .eq("business_id", business_id)
        .single();

      if (contactoTrivia && !contactoTrivia.jugo_trivia_hoy) {
        const { data: patrocinadorResp } = await supabase
          .from("patrocinadores").select("nombre").eq("activo", true).limit(1).maybeSingle();
        const nombrePatrocinadorResp = patrocinadorResp?.nombre || "nuestros amigos";

        let msg = "";
        if (text === "trivia_correcta") {
          await supabase.from("users").update({ consultas_extra_hoy: 3, jugo_trivia_hoy: true }).eq("id", contactoTrivia.id);
          msg = `¡Correcto! Eres un verdadero fan. 🥳 Ganaste 3 consultas extra, patrocinado por ${nombrePatrocinadorResp}.`;
        } else {
          await supabase.from("users").update({ jugo_trivia_hoy: true }).eq("id", contactoTrivia.id);
          msg = `¡Casi! Esa no era. 😕 Gracias por participar en la trivia de ${nombrePatrocinadorResp}. ¡Nos vemos mañana!`;
        }
        await sendWhatsAppText({ accessToken, phoneNumberId, to: from, body: msg });
      }
      return new NextResponse("ok", { status: 200 });
    }

    // ── 2. RESPUESTA DE PRONÓSTICO ────────────────────────────────────
    // ID: prono~{resultado}~{equipo_local}~{equipo_visitante}~{momio}
    if (text.startsWith("prono~")) {
      const parts = text.split("~");
      if (parts.length >= 5) {
        const [, resultado, equipoLocal, equipoVisitante, momioStr] = parts;
        const momio = parseFloat(momioStr) || 1;

        const equipoElegido =
          resultado === "local" ? equipoLocal
          : resultado === "visitante" ? equipoVisitante
          : "Empate";

        // Buscar fecha del partido (fecha_partido es NOT NULL en la tabla)
        const { data: partido } = await supabase
          .from("partidos")
          .select("fecha_utc")
          .ilike("equipo_local", `%${equipoLocal.slice(0, 5)}%`)
          .ilike("equipo_visitante", `%${equipoVisitante.slice(0, 5)}%`)
          .maybeSingle();
        const fechaPartido = partido?.fecha_utc || new Date().toISOString();

        // Evitar duplicado para el mismo partido
        const { data: existing } = await supabase
          .from("pronosticos")
          .select("id")
          .eq("whatsapp_id", from)
          .eq("equipo_local", equipoLocal)
          .eq("equipo_visitante", equipoVisitante)
          .maybeSingle();

        if (existing) {
          await supabase.from("pronosticos")
            .update({ pronostico: resultado, momio })
            .eq("id", existing.id);
        } else {
          await supabase.from("pronosticos").insert({
            whatsapp_id: from,
            equipo_local: equipoLocal,
            equipo_visitante: equipoVisitante,
            pronostico: resultado,
            momio,
            fecha_partido: fechaPartido,
            acerto: null,
            notificado: false,
          });
        }

        const PRONO_SPONSOR = process.env.PRONO_SPONSOR || "";
        const msg = pronoGuardadoMessage(equipoElegido, momio, 200, PRONO_SPONSOR || undefined);
        await sendWhatsAppText({ accessToken, phoneNumberId, to: from, body: msg });
      }
      return new NextResponse("ok", { status: 200 });
    }

    // ── 3. OBTENER O CREAR USUARIO ────────────────────────────────────
    let { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("business_id", business_id)
      .eq("phone", from)
      .maybeSingle();

    // ── 4. NUEVO USUARIO: bienvenida + pregunta alertas (no cuenta) ───
    if (!user) {
      const { data: nuevo } = await supabase
        .from("users")
        .insert({
          phone: from,
          whatsapp_id: from,
          name: profileName,
          business_id,
          plan: "free",
          consultas_hoy: 0,
          fecha_ultima_consulta: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      user = nuevo;
      console.log("👤 Usuario creado:", profileName ?? "sin nombre");

      const nombre = profileName ? profileName.split(" ")[0] : "fan";
      const welcomeMsg =
        `¡Hola ${nombre}! 👋 Soy *FanBot*, tu guía del Mundial 2026 🏆\n\n` +
        `Puedo responderte sobre partidos, horarios, grupos, selecciones y toda la historia del Mundial. ` +
        `Cuanto más clara sea tu pregunta, mejor será mi respuesta.\n\n` +
        `También puedo enviarte alertas *15 minutos antes* de cada partido. ` +
        `¿Quieres activarlas?`;

      await sendWhatsAppReplyButtons({
        accessToken, phoneNumberId, to: from,
        body: welcomeMsg,
        buttons: [
          { id: "alertas_si", title: "Sí, activar ✅" },
          { id: "alertas_no", title: "No, gracias" },
        ],
      });
      return new NextResponse("ok", { status: 200 });
    }

    // ── 5. ACTIVACIÓN DE ALERTAS (no cuenta como consulta) ───────────
    if (text === "alertas_si" || (user.alertas_activas === null && AFIRMATIVOS.has(normText(text)))) {
      await supabase.from("users").update({ alertas_activas: true }).eq("id", user.id);
      await sendWhatsAppText({
        accessToken, phoneNumberId, to: from,
        body: `¡Perfecto! 🔔 Te avisaré 15 minutos antes de cada partido. Tienes *5 consultas gratis al día*. ¿Qué quieres saber del Mundial?`,
      });
      return new NextResponse("ok", { status: 200 });
    }

    if (text === "alertas_no" || (user.alertas_activas === null && NEGATIVOS.has(normText(text)))) {
      await supabase.from("users").update({ alertas_activas: false }).eq("id", user.id);
      await sendWhatsAppText({
        accessToken, phoneNumberId, to: from,
        body: `Entendido. 👍 Tienes *5 consultas gratis al día*. ¿Qué quieres saber del Mundial?`,
      });
      return new NextResponse("ok", { status: 200 });
    }

    // ── 6a. DESCARGA DE CALENDARIO ICS (no cuenta como consulta) ──────
    const CALENDAR_TRIGGERS = [
      "quiero mi calendario", "quiero el calendario",
      "dame mi calendario", "dame el calendario",
      "descargar calendario", "bajar calendario",
      "descargar el calendario", "bajar el calendario",
    ];
    const textLow = text.toLowerCase();
    const esDescargaCalendario = CALENDAR_TRIGGERS.some((kw) => textLow.includes(kw));

    if (esDescargaCalendario) {
      await sendWhatsAppDocument({
        accessToken, phoneNumberId, to: from,
        link: `${APP_URL}/api/calendario`,
        filename: "Mundial2026.ics",
        caption: "📅 Aquí está tu calendario del Mundial 2026. Ábrelo para agregar todos los partidos a tu celular con alertas 15 min antes. ⚽🏆",
      });
      return new NextResponse("ok", { status: 200 });
    }

    // ── 6. SALUDO PURO (no cuenta como consulta) ──────────────────────
    if (esPuraSaludo(text)) {
      const nombre = user.name ? user.name.split(" ")[0] : "fan";
      await sendWhatsAppText({
        accessToken, phoneNumberId, to: from,
        body: `¡Hola ${nombre}! ⚽ ¿Qué quieres saber del Mundial 2026?`,
      });
      return new NextResponse("ok", { status: 200 });
    }

    // ── 7. LÓGICA DE CONTADOR ─────────────────────────────────────────
    const hoy = new Date();
    const ultimaConsulta = user.fecha_ultima_consulta
      ? new Date(user.fecha_ultima_consulta)
      : user.consultas_reset ? new Date(user.consultas_reset) : null;

    let consultasHoy = user.consultas_hoy || 0;
    let jugoTrivia = user.jugo_trivia_hoy || false;
    let consultasExtra = user.consultas_extra_hoy || 0;

    if (ultimaConsulta && isSameDayInMX(hoy, ultimaConsulta)) {
      consultasHoy++;
    } else {
      consultasHoy = 1;
      jugoTrivia = false;
      consultasExtra = 0;
    }

    const updateData: Record<string, unknown> = {
      consultas_hoy: consultasHoy,
      jugo_trivia_hoy: jugoTrivia,
      consultas_extra_hoy: consultasExtra,
      fecha_ultima_consulta: hoy.toISOString(),
    };
    if (profileName && (!user.name || user.name === "Desconocido")) {
      updateData.name = profileName;
    }

    const { data: updatedContact, error: updateError } = await supabase
      .from("users").update(updateData).eq("id", user.id).select("*").single();

    if (updateError) console.error("❌ Error actualizando contador:", updateError);

    const contactoActualizado = updatedContact || user;
    const limiteDiario = 5 + (contactoActualizado.consultas_extra_hoy || 0);
    const consultasActuales = contactoActualizado.consultas_hoy || 0;

    console.log(`[LIMIT] ${from}: ${consultasActuales}/${limiteDiario} trivia=${contactoActualizado.jugo_trivia_hoy}`);

    // ── 8. LÍMITE ALCANZADO ───────────────────────────────────────────
    if (consultasActuales >= limiteDiario) {
      const { data: patrocinador } = await supabase
        .from("patrocinadores").select("nombre").eq("activo", true).limit(1).maybeSingle();
      const nombrePatrocinador = patrocinador?.nombre || "nuestros amigos";

      if (!contactoActualizado.jugo_trivia_hoy) {
        const footer = `Trivia patrocinada por: ${nombrePatrocinador}`;
        const triviaUserPrompt = `Genera una trivia de fútbol sobre la Selección Mexicana. Dificultad media. Devuelve SOLO este JSON:
{"pregunta":"¿La pregunta? (máx 120 chars)","correcta":"Respuesta (máx 18 chars)","incorrecta_1":"Opción falsa 1 (máx 18 chars)","incorrecta_2":"Opción falsa 2 (máx 18 chars)"}`;

        try {
          const triviaResponse = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
              { role: "system", content: "Eres un generador de trivias de fútbol. Responde solo con el JSON solicitado." },
              { role: "user", content: triviaUserPrompt },
            ],
            response_format: { type: "json_object" },
          });
          const t = JSON.parse(triviaResponse.choices[0].message.content || "{}");
          if (!t.pregunta || !t.correcta || !t.incorrecta_1 || !t.incorrecta_2) throw new Error("JSON incompleto");

          const opciones = [
            { id: "trivia_correcta", title: String(t.correcta).slice(0, 18) },
            { id: "trivia_incorrecta_a", title: String(t.incorrecta_1).slice(0, 18) },
            { id: "trivia_incorrecta_b", title: String(t.incorrecta_2).slice(0, 18) },
          ].sort(() => Math.random() - 0.5);

          const triviaBody = `Has alcanzado tu límite de consultas gratuitas. ¡Si aciertas la trivia, ganas 3 más!\n\n*${t.pregunta}*`;
          await sendWhatsAppReplyButtons({ accessToken, phoneNumberId, to: from, body: triviaBody, buttons: opciones, footer });
        } catch (e) {
          console.error("❌ Fallback trivia.", e);
          const opciones = [
            { id: "trivia_correcta", title: "Javier Hernández" },
            { id: "trivia_incorrecta_a", title: "Hugo Sánchez" },
            { id: "trivia_incorrecta_b", title: "Cuauhtémoc Blanco" },
          ].sort(() => Math.random() - 0.5);
          const fallbackBody = `Has alcanzado tu límite de consultas. ¡Si aciertas la trivia, ganas 3 más!\n\n*¿Quién es el máximo goleador histórico de la Selección Mexicana?* ⚽`;
          await sendWhatsAppReplyButtons({ accessToken, phoneNumberId, to: from, body: fallbackBody, buttons: opciones, footer });
        }
      } else {
        await sendWhatsAppText({ accessToken, phoneNumberId, to: from, body: limitReachedMessage(APP_URL) });
      }
      return new NextResponse("ok", { status: 200 });
    }

    user = contactoActualizado;

    // ── 9. RESPUESTA DE IA ────────────────────────────────────────────
    const { data: botConfig } = await supabase
      .from("bot_config")
      .select("prompt")
      .eq("id", "singleton")
      .maybeSingle();

    const systemPrompt = getSystemPrompt({
      contacto: user || {},
      promptOverride: botConfig?.prompt ?? null,
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ];

    // Solo forzar getPartidos cuando la pregunta claramente pide el calendario/horario 2026,
    // no en preguntas históricas que usan palabras como "juego", "resultado", "fase", etc.
    const MATCH_TRIGGERS = [
      "cuándo juega", "cuando juega",
      "cuándo juegan", "cuando juegan",
      "próximo partido", "proximo partido",
      "primer partido",
      "a qué hora", "a que hora",
      "horario del partido", "horario del mundial",
      "calendario del mundial", "calendario 2026",
      "fixture", "jornada 2026",
    ];
    const textLower = text.toLowerCase();
    const forceMatchTool = MATCH_TRIGGERS.some((kw) => textLower.includes(kw));
    const toolChoice = forceMatchTool
      ? ({ type: "function", function: { name: "getPartidos" } } as const)
      : ("auto" as const);

    let response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      tools,
      tool_choice: toolChoice,
    });

    let responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;
    let firstPendingGame: { equipo_local: string; equipo_visitante: string } | null = null;

    if (toolCalls) {
      messages.push(responseMessage);

      for (const toolCall of toolCalls) {
        if (toolCall.type !== "function") continue;

        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        let functionResponse: string;

        if (functionName === "getPartidos") {
          functionResponse = await getPartidos(functionArgs.equipo);
          // Capturar el primer partido pendiente para ofrecer predicción
          try {
            const parsed = JSON.parse(functionResponse);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].equipo_local) {
              const first = parsed[0];
              if (first.resultado === "Por jugar") {
                firstPendingGame = { equipo_local: first.equipo_local, equipo_visitante: first.equipo_visitante };
              }
            }
          } catch { /* si falla el parse, sin predicción */ }
        } else if (functionName === "getMomios") {
          functionResponse = await getMomios(functionArgs.equipo);
        } else {
          console.error(`❌ Herramienta desconocida: ${functionName}`);
          continue;
        }

        messages.push({ tool_call_id: toolCall.id, role: "tool", content: functionResponse });
      }

      const secondResponse = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages,
      });
      responseMessage = secondResponse.choices[0].message;
    }

    const aiResponseText = responseMessage.content || "No pude procesar tu solicitud. Intenta de nuevo.";

    // ── 10. ENVIAR RESPUESTA DE IA ────────────────────────────────────
    let respuestaParsed: { type?: string; body?: string; buttons?: Array<{ id: string; title: string }> };
    try {
      respuestaParsed = JSON.parse(aiResponseText);
    } catch {
      respuestaParsed = { type: "text", body: aiResponseText };
    }

    // Pregunta de aclaración: revertir el contador (no cuenta como consulta)
    if (respuestaParsed.type === "clarify") {
      await supabase.from("users")
        .update({ consultas_hoy: Math.max(0, consultasActuales - 1) })
        .eq("id", user.id);
      await sendWhatsAppText({
        accessToken, phoneNumberId, to: from,
        body: respuestaParsed.body || "¿Puedes reformular tu pregunta?",
      });
      return new NextResponse("ok", { status: 200 });
    }

    if (respuestaParsed.type === "buttons" && respuestaParsed.buttons) {
      await sendWhatsAppReplyButtons({
        accessToken, phoneNumberId, to: from,
        body: respuestaParsed.body || aiResponseText,
        buttons: respuestaParsed.buttons,
      });
    } else {
      await sendWhatsAppText({
        accessToken, phoneNumberId, to: from,
        body: respuestaParsed.body || aiResponseText,
      });
    }

    // ── 11. OFRECER PREDICCIÓN (si el bot respondió sobre un partido) ─
    if (firstPendingGame) {
      const { equipo_local, equipo_visitante } = firstPendingGame;
      const mkId = (res: string, price: number) =>
        `prono~${res}~${equipo_local}~${equipo_visitante}~${price.toFixed(2)}`;

      let buttons: { id: string; title: string }[] = [];

      // Intentar obtener momios reales
      try {
        const events = await getWorldCupOdds();
        const event =
          findEventByTeamNormalized(events, equipo_local) ||
          findEventByTeamNormalized(events, equipo_visitante);

        if (event) {
          const h2h = event.bookmakers[0]?.markets.find((m) => m.key === "h2h");
          const outcomes = h2h?.outcomes ?? [];
          const homeOut = outcomes.find((o) => o.name !== "Draw" &&
            normalizeStr(o.name).includes(normalizeStr(event.home_team).slice(0, 4))) ?? outcomes[0];
          const awayOut = outcomes.find((o) => o.name !== "Draw" && o !== homeOut) ?? outcomes[1];
          const drawOut = outcomes.find((o) => o.name === "Draw");

          if (homeOut && awayOut) {
            const mkTitle = (name: string, price: number) =>
              `${name} (x${price.toFixed(2)})`.slice(0, 20);
            buttons = [
              { id: mkId("local", homeOut.price), title: mkTitle(homeOut.name, homeOut.price) },
              { id: mkId("visitante", awayOut.price), title: mkTitle(awayOut.name, awayOut.price) },
            ];
            if (drawOut) buttons.push({ id: mkId("empate", drawOut.price), title: mkTitle("Empate", drawOut.price) });
          }
        }
      } catch (e) {
        console.log("Sin momios para predicción:", e);
      }

      // Fallback: botones sin momios
      if (buttons.length === 0) {
        buttons = [
          { id: mkId("local", 1), title: equipo_local.slice(0, 20) },
          { id: mkId("empate", 1), title: "Empate" },
          { id: mkId("visitante", 1), title: equipo_visitante.slice(0, 20) },
        ];
      }

      await sendWhatsAppReplyButtons({
        accessToken, phoneNumberId, to: from,
        body: `¿Quién crees que gane? 🎯`,
        buttons: buttons.slice(0, 3),
      });
    }

    return new NextResponse("ok", { status: 200 });
  } catch (error) {
    console.error("🔥 Webhook error:", error);
    return new NextResponse("error", { status: 500 });
  }
}
