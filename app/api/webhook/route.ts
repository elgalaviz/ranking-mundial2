import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

/**
 * =========================
 * ENV VARS REQUERIDAS
 * =========================
 *
 * META_VERIFY_TOKEN=
 * WHATSAPP_TOKEN=
 * WHATSAPP_PHONE_NUMBER_ID=
 *
 * OPENAI_API_KEY=
 * OPENAI_MODEL=gpt-5-mini
 *
 * SUPABASE_URL=
 * SUPABASE_SERVICE_ROLE_KEY=
 */

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

type LeadRow = {
  id?: string;
  phone: string;
  name?: string | null;
  business_name?: string | null;
  city?: string | null;
  conversation_summary?: string | null;
  last_topic?: string | null;
  need_detected?: string | null;
  status?: string | null;
  last_user_message?: string | null;
  last_bot_message?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type MemoryUpdate = {
  ResumenConversacion: string;
  UltimoTema: string;
  NecesidadDetectada: string;
  Estado: "Interesado" | "Evaluando" | "Cliente";
};

type ExtractedData = {
  name?: string | null;
  business_name?: string | null;
  city?: string | null;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("WEBHOOK BODY:", JSON.stringify(body));

    const change = body?.entry?.[0]?.changes?.[0]?.value;
    if (!change) {
      return NextResponse.json({ ok: true, ignored: "no_change" }, { status: 200 });
    }

    // Ignorar status updates para evitar dobles respuestas
    if (Array.isArray(change.statuses) && change.statuses.length > 0) {
      console.log("IGNORADO: status_update");
      return NextResponse.json({ ok: true, ignored: "status_update" }, { status: 200 });
    }

    const message = change?.messages?.[0];
    if (!message) {
      console.log("IGNORADO: no_message");
      return NextResponse.json({ ok: true, ignored: "no_message" }, { status: 200 });
    }

    if (message.type !== "text" || !message.text?.body) {
      console.log("IGNORADO: non_text_message");
      return NextResponse.json({ ok: true, ignored: "non_text_message" }, { status: 200 });
    }

    const incomingText = cleanText(message.text.body);
    const phone = normalizePhone(String(message.from || ""));

    if (!phone || !incomingText) {
      console.log("IGNORADO: missing_phone_or_text", { phone, incomingText });
      return NextResponse.json({ ok: true, ignored: "missing_phone_or_text" }, { status: 200 });
    }

    let lead = await getLeadByPhone(phone);

    console.log("PHONE:", phone);
    console.log("MENSAJE:", incomingText);
    console.log("LEAD ANTES:", lead);

    const extracted = extractContactData(incomingText, lead);

    console.log("EXTRACTED:", extracted);

    lead = await upsertLeadMemory(phone, extracted, incomingText, lead);

    console.log("LEAD DESPUES UPSERT:", lead);

    // Flujo especial: intención de llamada
    if (isCallIntent(incomingText)) {
      const callReply =
        "Perfecto, te agendamos para llamada y revisamos tu caso a detalle.\n\n" +
        "Por cierto, para que lo tengas en cuenta: esta conversación la estás teniendo con un asistente con inteligencia artificial como el que implementamos para negocios.\n\n" +
        "Si te interesa algo así para tu empresa, coméntalo en la llamada y te explicamos cómo aplicarlo en tu caso.";

      console.log("CALL INTENT DETECTED");
      console.log("BOT REPLY:", callReply);

      await sendWhatsAppText(phone, callReply);

      await updateLeadSummaryWithAI({
        lead,
        userMessage: incomingText,
        botReply: callReply,
      });

      return NextResponse.json({ ok: true, flow: "call_detected" }, { status: 200 });
    }

    const botReply = await generateAssistantReply({
      lead,
      incomingText,
    });

    console.log("BOT REPLY:", botReply);

    await sendWhatsAppText(phone, botReply);

    await updateLeadSummaryWithAI({
      lead,
      userMessage: incomingText,
      botReply,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook POST error:", error?.response?.data || error?.message || error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   HELPERS
========================================================= */

function cleanText(text: string): string {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(phone: string): string {
  return String(phone || "").replace(/\D/g, "").slice(-10);
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => {
      if (["y", "de", "del", "la", "las", "los", "el"].includes(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

function cleanBusinessName(value: string): string {
  return value
    .replace(/\s+y\s+est[aá]\s+en\s+.+$/i, "")
    .replace(/\s+est[aá]\s+en\s+.+$/i, "")
    .replace(/[.]+$/g, "")
    .trim();
}

function isCallIntent(text: string): boolean {
  const t = text.toLowerCase();

  const keywords = [
    "llamada",
    "llamen",
    "llámame",
    "llamame",
    "marcar",
    "márcame",
    "marcame",
    "contacten",
    "quiero llamada",
    "prefiero llamada",
    "hablar con alguien",
    "que me llamen",
    "me pueden llamar",
    "pueden llamarme",
    "agendar llamada",
    "agenda una llamada",
    "quisiera una llamada",
  ];

  return keywords.some((k) => t.includes(k));
}

async function getLeadByPhone(phone: string): Promise<LeadRow | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  if (error) {
    console.error("getLeadByPhone error:", error.message);
    return null;
  }

  return data as LeadRow | null;
}

function extractName(text: string, existingLead?: LeadRow | null): string | null {
  const normalized = text.trim();

  if (existingLead?.name) return existingLead.name;

  const patterns = [
    /(?:me llamo|mi nombre es|soy)\s+([A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,50})/i,
    /(?:nombre[:\s]+)([A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,50})/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return toTitleCase(match[1].trim());
    }
  }

  const cleaned = normalized.replace(/[.,;:!?]/g, "").trim();
  const words = cleaned.split(/\s+/);

  if (
    words.length >= 1 &&
    words.length <= 3 &&
    /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(cleaned) &&
    !/(guadalupe|monterrey|apodaca|saltillo|quer[eé]taro|cdmx|m[eé]rida|canc[uú]n|negocio|empresa|tienda|ventas|marketing|redes|publicidad)/i.test(
      cleaned
    )
  ) {
    return toTitleCase(cleaned);
  }

  return null;
}

function extractBusiness(text: string, existingLead?: LeadRow | null): string | null {
  if (existingLead?.business_name) return existingLead.business_name;

  const normalized = text.trim();

  const patterns = [
    /mi negocio se llama\s+(.+?)(?:\.|,|$)/i,
    /mi empresa se llama\s+(.+?)(?:\.|,|$)/i,
    /el negocio se llama\s+(.+?)(?:\.|,|$)/i,
    /la empresa se llama\s+(.+?)(?:\.|,|$)/i,
    /mi negocio es\s+(.+?)(?:\.|,|$)/i,
    /mi empresa es\s+(.+?)(?:\.|,|$)/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return cleanBusinessName(match[1]);
    }
  }

  return null;
}

function extractCity(text: string, existingLead?: LeadRow | null): string | null {
  if (existingLead?.city) return existingLead.city;

  const normalized = text.trim();

  const patterns = [
    /est[aá]\s+en\s+([A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,50})/i,
    /estoy en\s+([A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,50})/i,
    /ubicado en\s+([A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,50})/i,
    /ubicada en\s+([A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,50})/i,
    /soy de\s+([A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,50})/i,
    /estamos en\s+([A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,50})/i,
    /desde\s+([A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,50})/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return toTitleCase(
        match[1]
          .trim()
          .replace(/\b(nl|n\.l\.|nuevo le[oó]n|coahuila|qro|quer[eé]taro|m[eé]xico)\b/gi, "")
          .trim()
      );
    }
  }

  const cleaned = normalized.replace(/[.,;:!?]/g, "").trim();
  const possibleCities = [
    "Guadalupe",
    "Monterrey",
    "San Nicolás",
    "Apodaca",
    "Escobedo",
    "Santa Catarina",
    "Saltillo",
    "Querétaro",
    "CDMX",
    "Mérida",
    "Cancún",
    "Torreón",
    "Guadalajara",
    "Puebla",
  ];

  const found = possibleCities.find(
    (city) => city.toLowerCase() === cleaned.toLowerCase()
  );

  if (found) return found;

  return null;
}

function extractContactData(text: string, existingLead: LeadRow | null): ExtractedData {
  return {
    name: extractName(text, existingLead) ?? existingLead?.name ?? null,
    business_name: extractBusiness(text, existingLead) ?? existingLead?.business_name ?? null,
    city: extractCity(text, existingLead) ?? existingLead?.city ?? null,
  };
}

async function upsertLeadMemory(
  phone: string,
  extracted: ExtractedData,
  incomingText: string,
  existingLead: LeadRow | null
): Promise<LeadRow> {
  if (!supabase) {
    return {
      phone,
      name: extracted.name || existingLead?.name || null,
      business_name: extracted.business_name || existingLead?.business_name || null,
      city: extracted.city || existingLead?.city || null,
      last_user_message: incomingText,
    };
  }

  const payload: LeadRow = {
    phone,
    name: extracted.name ?? existingLead?.name ?? null,
    business_name: extracted.business_name ?? existingLead?.business_name ?? null,
    city: extracted.city ?? existingLead?.city ?? null,
    conversation_summary: existingLead?.conversation_summary ?? null,
    last_topic: existingLead?.last_topic ?? null,
    need_detected: existingLead?.need_detected ?? null,
    status: existingLead?.status ?? "Interesado",
    last_user_message: incomingText,
    updated_at: new Date().toISOString(),
  };

  let data: LeadRow | null = null;
  let error: any = null;

  if (existingLead?.id) {
    const result = await supabase
      .from("leads")
      .update(payload)
      .eq("id", existingLead.id)
      .select("*")
      .single();

    data = result.data as LeadRow | null;
    error = result.error;
  } else {
    const result = await supabase
      .from("leads")
      .upsert(payload, { onConflict: "phone" })
      .select("*")
      .single();

    data = result.data as LeadRow | null;
    error = result.error;
  }

  if (error) {
    console.error("upsertLeadMemory error:", error.message);
    return {
      ...(existingLead || { phone }),
      ...payload,
    };
  }

  return data || {
    ...(existingLead || { phone }),
    ...payload,
  };
}

async function generateAssistantReply({
  lead,
  incomingText,
}: {
  lead: LeadRow | null;
  incomingText: string;
}): Promise<string> {
  if (!OPENAI_API_KEY) {
    return fallbackReply(lead);
  }

  const knownName = lead?.name?.trim() || "";
  const knownBusiness = lead?.business_name?.trim() || "";
  const knownCity = lead?.city?.trim() || "";
  const summary = lead?.conversation_summary?.trim() || "";
  const lastTopic = lead?.last_topic?.trim() || "";
  const needDetected = lead?.need_detected?.trim() || "";
  const status = lead?.status?.trim() || "Interesado";

  const missingFields = {
    name: !knownName,
    business_name: !knownBusiness,
    city: !knownCity,
  };

  const developerPrompt = `
Eres el asistente comercial de Ranking Agencia por WhatsApp.
Tu objetivo es calificar prospectos sin sonar robot.

REGLAS CRÍTICAS:
1. Nunca vuelvas a pedir información que ya exista en memoria.
2. Si ya tienes nombre, negocio o ciudad, úsalo directamente.
3. Haz solo una pregunta a la vez.
4. No repitas bloques enteros.
5. Responde en español natural, claro y breve.
6. No uses markdown, listas ni títulos.
7. Máximo 80 palabras.
8. Si ya tienes nombre, negocio y ciudad, pregunta por su principal necesidad u objetivo.
9. No inventes datos.
10. Si el usuario acaba de compartir un dato, reconócelo y avanza.

MEMORIA ACTUAL:
Nombre: ${knownName || "desconocido"}
Negocio: ${knownBusiness || "desconocido"}
Ciudad: ${knownCity || "desconocida"}
Resumen: ${summary || "sin resumen"}
Último tema: ${lastTopic || "sin tema"}
Necesidad detectada: ${needDetected || "sin detectar"}
Estado: ${status}

CAMPOS FALTANTES:
Falta nombre: ${missingFields.name ? "sí" : "no"}
Falta negocio: ${missingFields.business_name ? "sí" : "no"}
Falta ciudad: ${missingFields.city ? "sí" : "no"}

LÓGICA:
- Si falta nombre, pide solo el nombre.
- Si falta negocio, pide solo el nombre del negocio.
- Si falta ciudad, pide solo la ciudad.
- Si ya tienes los tres, pregunta qué quiere lograr: más ventas, más mensajes, más visibilidad, pauta, web, redes o similar.
`;

  const userPrompt = `Mensaje del cliente: ${incomingText}`;

  try {
    const response = await openai.responses.create({
      model: OPENAI_MODEL,
      input: [
        {
          role: "developer",
          content: [{ type: "input_text", text: developerPrompt }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: userPrompt }],
        },
      ],
    });

    const text = extractResponseText(response);
    if (text) return normalizeReply(text);

    return fallbackReply(lead);
  } catch (error) {
    console.error("generateAssistantReply error:", error);
    return fallbackReply(lead);
  }
}

function fallbackReply(lead: LeadRow | null): string {
  if (!lead?.name) {
    return "Perfecto. Para avanzar bien, compárteme tu nombre, por favor.";
  }

  if (!lead?.business_name) {
    return `Perfecto, ${lead.name}. Ahora dime el nombre de tu negocio.`;
  }

  if (!lead?.city) {
    return `Gracias, ${lead.name}. ¿En qué ciudad está tu negocio?`;
  }

  return `Perfecto, ${lead.name}. Ya tengo que tu negocio es ${lead.business_name} y está en ${lead.city}. Ahora cuéntame, ¿qué te gustaría lograr primero: más ventas, más mensajes o más presencia en redes?`;
}

function normalizeReply(text: string): string {
  return text
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function extractResponseText(response: any): string {
  if (!response) return "";

  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const output = response.output || [];
  for (const item of output) {
    const content = item?.content || [];
    for (const part of content) {
      if (part?.type === "output_text" && part?.text) {
        return String(part.text).trim();
      }
    }
  }

  return "";
}

async function sendWhatsAppText(to: string, body: string) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error("Missing WhatsApp credentials");
  }

  const url = `https://graph.facebook.com/v23.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("sendWhatsAppText error:", data);
    throw new Error(data?.error?.message || "Failed to send WhatsApp message");
  }

  return data;
}

async function updateLeadSummaryWithAI({
  lead,
  userMessage,
  botReply,
}: {
  lead: LeadRow | null;
  userMessage: string;
  botReply: string;
}) {
  if (!supabase || !lead?.phone) return;

  const previousSummary = lead?.conversation_summary || "";
  const previousTopic = lead?.last_topic || "";
  const previousNeed = lead?.need_detected || "";
  const previousStatus = lead?.status || "Interesado";

  let memory: MemoryUpdate = {
    ResumenConversacion: previousSummary,
    UltimoTema: previousTopic,
    NecesidadDetectada: previousNeed,
    Estado: previousStatus as MemoryUpdate["Estado"],
  };

  if (OPENAI_API_KEY) {
    try {
      const prompt = `
Analiza la conversación y actualiza la memoria comercial del lead.

RESUMEN PREVIO:
${previousSummary || "Sin resumen previo"}

ULTIMO TEMA PREVIO:
${previousTopic || "Sin tema previo"}

NECESIDAD PREVIA:
${previousNeed || "Sin necesidad detectada"}

ESTADO PREVIO:
${previousStatus || "Interesado"}

MENSAJE NUEVO DEL CLIENTE:
${userMessage}

RESPUESTA DEL BOT:
${botReply}

Devuelve únicamente un objeto JSON puro con esta estructura exacta:
{
  "ResumenConversacion": "",
  "UltimoTema": "",
  "NecesidadDetectada": "",
  "Estado": ""
}

REGLAS:
- Estado debe ser solo uno de estos valores:
Interesado
Evaluando
Cliente
- No pongas markdown.
- No pongas texto antes o después del JSON.
- Resume de forma compacta y útil para ventas.
`;

      const response = await openai.responses.create({
        model: OPENAI_MODEL,
        input: [
          {
            role: "developer",
            content: [{ type: "input_text", text: "Responde solo JSON válido." }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: prompt }],
          },
        ],
      });

      const raw = extractResponseText(response);
      const parsed = safeJsonParse<MemoryUpdate>(raw);

      if (
        parsed &&
        parsed.ResumenConversacion !== undefined &&
        parsed.UltimoTema !== undefined &&
        parsed.NecesidadDetectada !== undefined &&
        ["Interesado", "Evaluando", "Cliente"].includes(parsed.Estado)
      ) {
        memory = parsed;
      }
    } catch (error) {
      console.error("updateLeadSummaryWithAI error:", error);
    }
  }

  const { error } = await supabase
    .from("leads")
    .update({
      conversation_summary: memory.ResumenConversacion,
      last_topic: memory.UltimoTema,
      need_detected: memory.NecesidadDetectada,
      status: memory.Estado,
      last_user_message: userMessage,
      last_bot_message: botReply,
      updated_at: new Date().toISOString(),
    })
    .eq("phone", lead.phone);

  if (error) {
    console.error("updateLeadSummaryWithAI supabase error:", error.message);
  }
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    const firstBrace = value.indexOf("{");
    const lastBrace = value.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(value.slice(firstBrace, lastBrace + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}