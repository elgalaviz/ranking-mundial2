import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import crypto from "crypto";
import { sendWhatsAppText } from "@/lib/ai/sendWhatsAppText";
import { sendWhatsAppReplyButtons } from "@/lib/ai/sendWhatsAppInteractive";
import { getSystemPrompt } from "@/lib/ai/systemPrompt";
import { tools, getPartidos, getJugadores, getGrupos, buscarHistorial, buscarWikipedia, getTriviaAleatoria } from "@/lib/ai/tools";
import { welcomeMessage, limitReachedMessage, pronoGuardadoMessage } from "@/lib/fanbot/messages";

export const runtime = "nodejs";

// --- Trivia helpers ---
type TriviaItem = { id: number; pregunta: string; opciones: string[]; respuesta: string; dato: string };

function loadTrivia(): TriviaItem[] {
  try {
    const raw = require("fs").readFileSync(require("path").join(process.cwd(), "data", "trivia_mexico.json"), "utf-8");
    return JSON.parse(raw) as TriviaItem[];
  } catch { return []; }
}

function getRandomTrivia(): TriviaItem {
  const list = loadTrivia();
  return list.length > 0 ? list[Math.floor(Math.random() * list.length)] : {
    id: 0,
    pregunta: "¿Quién es el máximo goleador histórico de la Selección Mexicana?",
    opciones: ["Chicharito", "Hugo Sánchez", "C. Blanco"],
    respuesta: "Chicharito",
    dato: "Javier Hernández tiene 52 goles con El Tri. El mejor de todos.",
  };
}

function getTriviaById(id: number): TriviaItem | null {
  const list = loadTrivia();
  return list.find(t => t.id === id) ?? null;
}

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://rankingmundial26.com").replace(/\/$/, "");
const PRONO_SPONSOR = process.env.PRONO_SPONSOR || "";
const WA_BOT_NUMBER = process.env.WA_BOT_NUMBER || "5218112993097";
const META_APP_SECRET = process.env.META_APP_SECRET || "";
const MAX_FREE_QUERIES = 25;

function verifyMetaSignature(rawBody: string, signature: string | null): boolean {
  if (!META_APP_SECRET) {
    console.error("🚨 META_APP_SECRET no configurado — rechazando request");
    return false;
  }
  if (!signature) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", META_APP_SECRET).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

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
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(rawBody, signature)) {
    console.warn("⚠️ Firma inválida — request rechazado", { signature });
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = getSupabase();
  try {
    const body = JSON.parse(rawBody);
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
    } else if (message.type === "button") {
      // Quick reply desde plantilla de template
      text = message.button?.payload || "";
    } else if (message.type === "text") {
      text = (message.text?.body || "").trim();
    } else {
      return new NextResponse("ok", { status: 200 });
    }

    if (!text) return new NextResponse("ok", { status: 200 });
    const incomingText = text.toLowerCase();
    console.log(`📩 Mensaje de ${from} (${profileName}): "${text}"`);

    // --- Botón "Retar a un amigo" ---
    if (text.startsWith("retar_") && text.length === 38) {
      const idShort = text.replace("retar_", "");
      const partidoId = [
        idShort.slice(0, 8), idShort.slice(8, 12),
        idShort.slice(12, 16), idShort.slice(16, 20), idShort.slice(20),
      ].join("-");

      const { data: partido } = await supabase
        .from("partidos")
        .select("equipo_local, equipo_visitante")
        .eq("id", partidoId)
        .single();

      if (!partido) {
        await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: "No encontré el partido 😕" });
        return new NextResponse("ok", { status: 200 });
      }

      const retoLink = `${APP_URL}/reto/${idShort}`;

      await sendWhatsAppText({
        accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from,
        body: `👇 Reenvía el siguiente mensaje a tu amigo para retarlo:`,
      });
      await sendWhatsAppText({
        accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from,
        body: `🏆 Te reto a pronosticar el *${partido.equipo_local} vs ${partido.equipo_visitante}*\n\n¿Quién acierta? Da clic aquí y elige tu pronóstico:\n\n👉 ${retoLink}\n\nSolo toca el link, elige y veamos quién gana ⚽`,
      });
      return new NextResponse("ok", { status: 200 });
    }

    // --- Amigo retado llega al bot ---
    if (incomingText.includes("me retaron y quiero pronosticar el")) {
      const match = text.match(/pronosticar el (.+?) vs (.+)/i);
      if (!match) {
        await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: "¡Bienvenido al reto! 🏆 Dime qué partido quieres pronosticar." });
        return new NextResponse("ok", { status: 200 });
      }

      const [, localRaw, visitanteRaw] = match;
      const { data: partido } = await supabase
        .from("partidos")
        .select("id, equipo_local, equipo_visitante, fecha_utc")
        .ilike("equipo_local", `%${localRaw.trim().slice(0, 6)}%`)
        .ilike("equipo_visitante", `%${visitanteRaw.trim().slice(0, 6)}%`)
        .maybeSingle();

      if (!partido || new Date(partido.fecha_utc) < new Date()) {
        await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: "¡Bienvenido al reto! 🏆 Ese partido ya comenzó o no lo encontré, pero puedes pronosticar cualquier otro partido preguntándome por él. ⚽" });
        return new NextResponse("ok", { status: 200 });
      }

      const idShortClean = partido.id.replace(/-/g, "");
      const short = (name: string) => name.split(" ")[0].slice(0, 9);
      let buttons: { id: string; title: string }[] = [];

      buttons = [
        { id: `prono_L_100_${idShortClean}`, title: short(partido.equipo_local).slice(0, 20) },
        { id: `prono_E_100_${idShortClean}`, title: "Empate" },
        { id: `prono_V_100_${idShortClean}`, title: short(partido.equipo_visitante).slice(0, 20) },
      ];

      await sendWhatsAppReplyButtons({
        accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from,
        body: `🏆 *¡Te aceptamos el reto!*\n\n¿Cómo crees que quede *${partido.equipo_local} vs ${partido.equipo_visitante}*?`,
        buttons,
        footer: "🎮 Solo entretenimiento · Sin dinero real",
      });

      await sendWhatsAppReplyButtons({
        accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from,
        body: `🔔 ¿Quieres que te avise 15 minutos antes de cada partido del Mundial?`,
        buttons: [
          { id: "si alertas", title: "✅ Sí, quiero alertas" },
          { id: "no alertas", title: "❌ No gracias" },
        ],
      });
      return new NextResponse("ok", { status: 200 });
    }

    // --- Confirmar cambio de pronóstico ---
    if (text.startsWith("cambiar_prono_") && text.split("_").length === 5) {
      const [, , outcome, momio100Str, idShort] = text.split("_");
      const momio = parseInt(momio100Str) / 100;
      const partidoId = [
        idShort.slice(0, 8), idShort.slice(8, 12),
        idShort.slice(12, 16), idShort.slice(16, 20), idShort.slice(20),
      ].join("-");

      const { data: partido } = await supabase
        .from("partidos")
        .select("id, equipo_local, equipo_visitante, fecha_utc")
        .eq("id", partidoId)
        .single();

      if (!partido || new Date(partido.fecha_utc) < new Date()) {
        await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: "⏱️ Ya no es posible cambiar el pronóstico, el partido comenzó." });
        return new NextResponse("ok", { status: 200 });
      }

      const pronostico = outcome === "L" ? "local" : outcome === "E" ? "empate" : "visitante";
      const equipoElegido = outcome === "L" ? partido.equipo_local : outcome === "E" ? "Empate" : partido.equipo_visitante;

      await supabase
        .from("pronosticos")
        .update({ pronostico, momio })
        .eq("whatsapp_id", waId)
        .eq("equipo_local", partido.equipo_local)
        .eq("equipo_visitante", partido.equipo_visitante);

      const idShortCleanCambio = partido.id.replace(/-/g, "");
      await sendWhatsAppReplyButtons({
        accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from,
        body: pronoGuardadoMessage(equipoElegido, momio, 200, PRONO_SPONSOR, APP_URL),
        buttons: [{ id: `retar_${idShortCleanCambio}`, title: "🏆 Retar a un amigo" }],
      });
      return new NextResponse("ok", { status: 200 });
    }

    if (text === "no_cambiar_prono") {
      await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: "👍 Ok, mantenemos tu pronóstico. ¡Suerte! ⚽" });
      return new NextResponse("ok", { status: 200 });
    }

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

      const pronostico = outcome === "L" ? "local" : outcome === "E" ? "empate" : "visitante";
      const equipoElegido = outcome === "L" ? partido.equipo_local : outcome === "E" ? "Empate" : partido.equipo_visitante;

      const { data: existing } = await supabase
        .from("pronosticos")
        .select("id, pronostico")
        .eq("whatsapp_id", waId)
        .eq("equipo_local", partido.equipo_local)
        .eq("equipo_visitante", partido.equipo_visitante)
        .maybeSingle();

      if (existing) {
        if (existing.pronostico === pronostico) {
          const labels: Record<string, string> = { local: partido.equipo_local, empate: "Empate", visitante: partido.equipo_visitante };
          const idShortCleanSame = partido.id.replace(/-/g, "");
          await sendWhatsAppReplyButtons({
            accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from,
            body: `Ya tienes guardado ese mismo pronóstico: *${labels[existing.pronostico]}* 👍 ¡Suerte!\n\n📋 Ver mis pronósticos: ${APP_URL}/pronosticos`,
            buttons: [{ id: `retar_${idShortCleanSame}`, title: "🏆 Retar a un amigo" }],
          });
          return new NextResponse("ok", { status: 200 });
        }
        const labels: Record<string, string> = { local: partido.equipo_local, empate: "Empate", visitante: partido.equipo_visitante };
        const idShortClean = partido.id.replace(/-/g, "");
        await sendWhatsAppReplyButtons({
          accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from,
          body: `Ya tienes guardado: *${labels[existing.pronostico]}*. ¿Quieres cambiarlo por *${equipoElegido}*?`,
          buttons: [
            { id: `cambiar_prono_${outcome}_${momio100Str}_${idShortClean}`, title: "✅ Sí, cambiarlo" },
            { id: "no_cambiar_prono", title: "❌ No, dejarlo" },
          ],
        });
        return new NextResponse("ok", { status: 200 });
      }

      await supabase.from("pronosticos").insert({
        whatsapp_id: waId,
        equipo_local: partido.equipo_local,
        equipo_visitante: partido.equipo_visitante,
        pronostico,
        momio,
        fecha_partido: partido.fecha_utc,
      });

      const idShortClean2 = partido.id.replace(/-/g, "");
      await sendWhatsAppReplyButtons({
        accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from,
        body: pronoGuardadoMessage(equipoElegido, momio, 200, PRONO_SPONSOR, APP_URL),
        buttons: [{ id: `retar_${idShortClean2}`, title: "🏆 Retar a un amigo" }],
      });
      return new NextResponse("ok", { status: 200 });
    }

    // --- Botón "Quiero dar mi pronóstico" desde plantilla de alerta ---
    if (text.startsWith("quiero_pronostico_")) {
      const idShort = text.replace("quiero_pronostico_", "");
      const partidoId = [
        idShort.slice(0, 8), idShort.slice(8, 12),
        idShort.slice(12, 16), idShort.slice(16, 20), idShort.slice(20),
      ].join("-");

      const { data: partido } = await supabase
        .from("partidos")
        .select("id, equipo_local, equipo_visitante, fecha_utc, goles_local")
        .eq("id", partidoId)
        .single();

      if (!partido || new Date(partido.fecha_utc) < new Date()) {
        await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: "⏱️ Ese partido ya comenzó, ya no es posible pronosticar." });
        return new NextResponse("ok", { status: 200 });
      }

      const idShortClean = partido.id.replace(/-/g, "");
      const short = (name: string) => name.split(" ")[0].slice(0, 9);
      let buttons: { id: string; title: string }[] = [];

      buttons = [
        { id: `prono_L_100_${idShortClean}`, title: short(partido.equipo_local).slice(0, 20) },
        { id: `prono_E_100_${idShortClean}`, title: "Empate" },
        { id: `prono_V_100_${idShortClean}`, title: short(partido.equipo_visitante).slice(0, 20) },
      ];

      await sendWhatsAppReplyButtons({
        accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from,
        body: `¿Cómo crees que quede ${partido.equipo_local} vs ${partido.equipo_visitante}? 🎯`,
        buttons,
        footer: "🎮 Solo entretenimiento · Sin dinero real",
      });
      return new NextResponse("ok", { status: 200 });
    }

    // --- Respuesta de trivia pre-partido (trivia_mx_{id}_{optIndex}) ---
    if (text.startsWith("trivia_mx_")) {
      const parts = text.split("_"); // ["trivia", "mx", id, optIndex]
      const qId = parseInt(parts[2]);
      const optIndex = parseInt(parts[3]);
      if (!isNaN(qId) && !isNaN(optIndex)) {
        const trivia = getTriviaById(qId);
        if (trivia) {
          const elegida = trivia.opciones[optIndex];
          const acerto = elegida === trivia.respuesta;
          const emoji = acerto ? "✅" : "❌";
          const intro = acerto ? "¡Correcto! 🎉" : `No era esa. La respuesta correcta es *${trivia.respuesta}*.`;
          const msg = `${emoji} ${intro}\n\n💡 ${trivia.dato}`;
          await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: msg });
        }
      }
      return new NextResponse("ok", { status: 200 });
    }

    // --- Respuesta de trivia (limit-hit) ---
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
    if (incomingText.includes("mis pronósticos") || incomingText.includes("mis pronosticos") || incomingText.includes("mis predicciones") || incomingText === "pronósticos" || incomingText === "pronosticos") {
      const { data: pronos } = await supabase
        .from("pronosticos")
        .select("equipo_local, equipo_visitante, pronostico, momio, acerto, fecha_partido")
        .eq("whatsapp_id", waId)
        .order("fecha_partido", { ascending: false });

      if (!pronos || pronos.length === 0) {
        await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: "Aún no tienes pronósticos guardados. Pregúntame por un partido y te mando los botones para pronosticar. ⚽" });
        return new NextResponse("ok", { status: 200 });
      }

      const labels: Record<string, string> = { local: "🏠 Local", empate: "🤝 Empate", visitante: "✈️ Visitante" };
      const estado = (acerto: boolean | null) => acerto === null ? "⏳ Pendiente" : acerto ? "✅ Acertaste" : "❌ Fallaste";

      const ultimos3 = pronos.slice(0, 3);
      const lineas = ultimos3.map(p =>
        `${p.equipo_local} vs ${p.equipo_visitante}\n  ${labels[p.pronostico]} (${p.momio}x) — ${estado(p.acerto)}`
      ).join("\n\n");

      const acertados = pronos.filter(p => p.acerto === true).length;
      const total = pronos.filter(p => p.acerto !== null).length;
      const resumen = total > 0 ? `\n\n🏆 Aciertos: ${acertados}/${total}` : "";
      const verTodos = pronos.length > 3 ? `\n\n📋 Ver todos tus ${pronos.length} pronósticos:\n${APP_URL}/pronosticos` : "";

      await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: `🎯 *Últimos pronósticos*\n\n${lineas}${resumen}${verTodos}` });
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
        const footer = `Trivia patrocinada por: ${sponsor}`;
        const trivia = getRandomTrivia();
        const opciones = trivia.opciones
          .map((op, i) => ({
            id: op === trivia.respuesta ? "trivia_correcta" : `trivia_incorrecta_${i}`,
            title: op.slice(0, 20),
          }))
          .sort(() => Math.random() - 0.5);
        const body = `Has alcanzado tu límite de mensajes gratuitos. ¡Si aciertas la trivia, ganas 3 mensajes más!\n\n*${trivia.pregunta}*`;
        await sendWhatsAppReplyButtons({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body, buttons: opciones, footer });
      } else {
        // Ya jugó trivia — ofrecer premium
        await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: limitReachedMessage(APP_URL) });
      }
      return new NextResponse("ok", { status: 200 });
    }

    // --- Generar respuesta con IA ---
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const { data: botConfig } = await supabase.from("bot_config").select("prompt").eq("id", 1).maybeSingle();
    const systemPrompt = getSystemPrompt({ contacto: { name: user.name }, promptOverride: botConfig?.prompt ?? null });
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
        } else if (toolCall.type === "function" && toolCall.function.name === "getGrupos") {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await getGrupos(args.grupo);
          console.log(`🛠️ getGrupos(${args.grupo || "todos"}) →`, result.slice(0, 120));
          messages.push({ tool_call_id: toolCall.id, role: "tool", content: result });
        } else if (toolCall.type === "function" && toolCall.function.name === "getJugadores") {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await getJugadores(args.equipo, args.posicion, args.nombre);
          console.log(`🛠️ getJugadores(${args.equipo || ""}) →`, result.slice(0, 120));
          messages.push({ tool_call_id: toolCall.id, role: "tool", content: result });
        } else if (toolCall.type === "function" && toolCall.function.name === "buscarHistorial") {
          const args = JSON.parse(toolCall.function.arguments);
          const result = buscarHistorial(args.tipo, args.año);
          console.log(`🛠️ buscarHistorial(${args.tipo}, ${args.año ?? "todos"}) →`, result.slice(0, 120));
          messages.push({ tool_call_id: toolCall.id, role: "tool", content: result });
        } else if (toolCall.type === "function" && toolCall.function.name === "buscarWikipedia") {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await buscarWikipedia(args.consulta);
          console.log(`🛠️ buscarWikipedia("${args.consulta}") →`, result.slice(0, 120));
          messages.push({ tool_call_id: toolCall.id, role: "tool", content: result });
        } else if (toolCall.type === "function" && toolCall.function.name === "getTriviaAleatoria") {
          const result = getTriviaAleatoria();
          console.log("🛠️ getTriviaAleatoria →", result.slice(0, 120));
          const trivia = JSON.parse(result);
          if (trivia.buttons) {
            await sendWhatsAppReplyButtons({
              accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from,
              body: `¡Aquí va una trivia! ⚽\n\n*${trivia.pregunta}*`,
              buttons: trivia.buttons,
              footer: "Toca una opción para responder",
            });
            await supabase.from("users").update({ consultas_hoy: consultasHoy + 1 }).eq("id", user.id);
            await supabase.from("registros_whatsapp").insert({ user_id: user.id, tipo_mensaje: "chatbot" });
            return new NextResponse("ok", { status: 200 });
          }
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

    if (parsed.tipo === "trivia_interactiva" && parsed.buttons) {
      // Trivia desde getTriviaAleatoria — el bot ya tiene la pregunta en el reply
      await sendWhatsAppReplyButtons({
        accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from,
        body: parsed.pregunta || reply,
        buttons: parsed.buttons,
        footer: "⚽ Trivia México",
      });
    } else if (parsed.type === "buttons" && parsed.buttons) {
      await sendWhatsAppReplyButtons({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: parsed.body, buttons: parsed.buttons });
    } else {
      await sendWhatsAppText({ accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from, body: parsed.body || reply });
    }

    // --- Botones de pronóstico (si el mensaje fue sobre un partido próximo) ---
    if (pronoMatch) {
      const idShort = pronoMatch.id.replace(/-/g, "");
      const short = (name: string) => name.split(" ")[0].slice(0, 9);
      let buttons: { id: string; title: string }[] = [];

      buttons = [
        { id: `prono_L_100_${idShort}`, title: short(pronoMatch.equipo_local).slice(0, 20) },
        { id: `prono_E_100_${idShort}`, title: "Empate" },
        { id: `prono_V_100_${idShort}`, title: short(pronoMatch.equipo_visitante).slice(0, 20) },
      ];

      await sendWhatsAppReplyButtons({
        accessToken: WHATSAPP_TOKEN, phoneNumberId: PHONE_NUMBER_ID, to: from,
        body: `¿Cómo crees que quede ${pronoMatch.equipo_local} vs ${pronoMatch.equipo_visitante}? 🎯`,
        buttons,
        footer: "🎮 Solo entretenimiento · Sin dinero real",
      });
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
