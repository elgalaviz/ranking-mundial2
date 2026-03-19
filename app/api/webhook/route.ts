import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

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

type ContactoRow = {
  id?: string;
  whatsapp: string;
  nombre: string | null;
  resumen: string | null;
  ultimo_tema: string | null;
  necesidad: string | null;
  estado: string | null;
  veces_contacto: number | null;
  created_at?: string | null;
  ultima_respuesta: string | null;
};

type SummaryMemory = {
  resumen: string;
  ultimo_tema: string;
  necesidad: string;
  estado: "Interesado" | "Evaluando" | "Llamar";
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
    const body: any = await req.json();
    console.log("WEBHOOK BODY:", JSON.stringify(body));

    const change = body?.entry?.[0]?.changes?.[0]?.value;
    if (!change) {
      return NextResponse.json({ ok: true, ignored: "no_change" }, { status: 200 });
    }

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
    const whatsapp = normalizePhone(String(message.from || ""));
    const messageId = String(message.id || "");
    const waProfileName = cleanText(change?.contacts?.[0]?.profile?.name || "");

    if (!whatsapp || !incomingText) {
      console.log("IGNORADO: missing_whatsapp_or_text", { whatsapp, incomingText });
      return NextResponse.json(
        { ok: true, ignored: "missing_whatsapp_or_text" },
        { status: 200 }
      );
    }

    console.log("WHATSAPP:", whatsapp);
    console.log("WA PROFILE NAME:", waProfileName);
    console.log("MENSAJE:", incomingText);

    let contacto = await getContactoByWhatsApp(whatsapp);
    console.log("CONTACTO ANTES:", contacto);

    contacto = await createOrUpdateContacto({
      whatsapp,
      waProfileName,
      existing: contacto,
    });

    await saveMessage({
      id: messageId,
      whatsapp,
      texto: incomingText,
      tipo: "cliente",
    });

    console.log("CONTACTO DESPUES CREATE/UPDATE:", contacto);

    if (isCallIntent(incomingText)) {
      const callReply =
        "Perfecto, te agendamos para llamada y revisamos tu caso a detalle.\n\n" +
        "Por cierto, para que lo tengas en cuenta: esta conversación la estás teniendo con un asistente con inteligencia artificial como el que implementamos para negocios.\n\n" +
        "Si te interesa algo así para tu empresa, coméntalo en la llamada y te explicamos cómo aplicarlo en tu caso.";

      console.log("CALL INTENT DETECTED");
      console.log("BOT REPLY:", callReply);

      await sendWhatsAppText(whatsapp, callReply);

      await saveMessage({
        id: `${messageId}-bot`,
        whatsapp,
        texto: callReply,
        tipo: "bot",
      });

      await updateContactoAfterReply({
        id: contacto?.id,
        ultima_respuesta: callReply,
      });

      await updateContactSummaryWithAI({
        contacto,
        userMessage: incomingText,
        botReply: callReply,
      });

      return NextResponse.json({ ok: true, flow: "call_detected" }, { status: 200 });
    }

    const botReply = await generateAssistantReply({
      contacto,
      incomingText,
    });

    console.log("BOT REPLY:", botReply);

    await sendWhatsAppText(whatsapp, botReply);

    await saveMessage({
      id: `${messageId}-bot`,
      whatsapp,
      texto: botReply,
      tipo: "bot",
    });

    await updateContactoAfterReply({
      id: contacto?.id,
      ultima_respuesta: botReply,
    });

    await updateContactSummaryWithAI({
      contacto,
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

function cleanText(text: string): string {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(phone: string): string {
  return String(phone || "").replace(/\D/g, "").slice(-10);
}

function isCallIntent(text: string): boolean {
  const t = String(text || "").toLowerCase();

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
    "llámenme",
    "llamenme",
  ];

  return keywords.some((k) => t.includes(k));
}

async function getContactoByWhatsApp(whatsapp: string): Promise<ContactoRow | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("contactos")
    .select("*")
    .eq("whatsapp", whatsapp)
    .maybeSingle();

  if (error) {
    console.error("getContactoByWhatsApp error:", error.message);
    return null;
  }

  return (data as ContactoRow | null) ?? null;
}

async function createOrUpdateContacto({
  whatsapp,
  waProfileName,
  existing,
}: {
  whatsapp: string;
  waProfileName: string;
  existing: ContactoRow | null;
}): Promise<ContactoRow | null> {
  if (!supabase) {
    return {
      whatsapp,
      nombre: existing?.nombre || waProfileName || null,
      resumen: existing?.resumen || null,
      ultimo_tema: existing?.ultimo_tema || null,
      necesidad: existing?.necesidad || null,
      estado: existing?.estado || "Interesado",
      veces_contacto: (existing?.veces_contacto || 0) + 1,
      ultima_respuesta: existing?.ultima_respuesta || null,
    };
  }

  const payload = {
    whatsapp,
    nombre: existing?.nombre || waProfileName || null,
    resumen: existing?.resumen || null,
    ultimo_tema: existing?.ultimo_tema || null,
    necesidad: existing?.necesidad || null,
    estado: existing?.estado || "Interesado",
    veces_contacto: (existing?.veces_contacto || 0) + 1,
    ultima_respuesta: existing?.ultima_respuesta || null,
  };

  let result;

  if (existing?.id) {
    result = await supabase
      .from("contactos")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();
  } else {
    result = await supabase
      .from("contactos")
      .insert(payload)
      .select("*")
      .single();
  }

  if (result.error) {
    console.error("createOrUpdateContacto error:", result.error.message);
    return {
      ...(existing || ({} as ContactoRow)),
      ...payload,
    } as ContactoRow;
  }

  return (result.data as ContactoRow) ?? null;
}

async function saveMessage({
  id,
  whatsapp,
  texto,
  tipo,
}: {
  id: string;
  whatsapp: string;
  texto: string;
  tipo: "cliente" | "bot";
}): Promise<void> {
  if (!supabase || !id || !whatsapp || !texto) return;

  const { error } = await supabase.from("mensajes_recibidos").upsert(
    {
      id,
      whatsapp,
      texto,
      tipo,
      created_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("saveMessage error:", error.message);
  }
}

async function updateContactoAfterReply({
  id,
  ultima_respuesta,
}: {
  id?: string;
  ultima_respuesta: string;
}): Promise<void> {
  if (!supabase || !id) return;

  const { error } = await supabase
    .from("contactos")
    .update({
      ultima_respuesta,
    })
    .eq("id", id);

  if (error) {
    console.error("updateContactoAfterReply error:", error.message);
  }
}

async function generateAssistantReply({
  contacto,
  incomingText,
}: {
  contacto: ContactoRow | null;
  incomingText: string;
}): Promise<string> {
  const nombre = cleanText(contacto?.nombre || "");
  const resumen = cleanText(contacto?.resumen || "");
  const ultimoTema = cleanText(contacto?.ultimo_tema || "");
  const necesidad = cleanText(contacto?.necesidad || "");
  const estado = cleanText(contacto?.estado || "Interesado");
  const vecesContacto = Number(contacto?.veces_contacto || 1);

  if (!OPENAI_API_KEY) {
    return minimalFallback({ nombre, vecesContacto });
  }

  const stageInstruction = getStageInstruction(vecesContacto);

  const developerPrompt = `
Eres el asistente comercial de Ranking Agencia por WhatsApp.

Tu trabajo NO es decidir el flujo comercial desde cero.
Tu trabajo es ejecutar con lenguaje natural la estrategia ya definida.

REGLAS DE TONO:
- Habla en español natural de México.
- Sé directo, claro y humano.
- No uses frases como "anoté", "ya guardé", "registro", "tomo que".
- No uses voseo como "querés", "contás", "decime".
- No uses markdown, listas ni títulos.
- Máximo 90 palabras.
- Haz solo una pregunta a la vez.
- No repitas preguntas ya respondidas.
- No inventes datos.
- No preguntes presupuesto como paso automático.
- No suenes como formulario ni como bot obvio.

ESTRATEGIA OBLIGATORIA:
- Veces de contacto actuales: ${vecesContacto}
- Instrucción estratégica de este turno: ${stageInstruction}

MEMORIA DISPONIBLE:
Nombre: ${nombre || "desconocido"}
Resumen previo: ${resumen || "sin resumen"}
Último tema: ${ultimoTema || "sin tema"}
Necesidad detectada: ${necesidad || "sin detectar"}
Estado actual: ${estado}

PROHIBIDO:
- Prometer envío de borradores
- Decir que ya se avanzó en producción
- Comprometer tiempos de entrega

REGLAS DE EJECUCIÓN:
- Respeta la intención estratégica del turno. No la cambies.
- La IA solo debe decidir cómo decir el mensaje, no qué etapa sigue.
- Si el resumen previo ya indica avance suficiente y estás en etapa de cierre, pregunta si quiere seguimiento por llamada.
- Si el usuario muestra interés:
  NO prometas entregables ni avances ficticios.
  Lleva la conversación hacia una llamada para revisar su caso.
- Si ya fue atendido varias veces, evita repetir exploración básica.
- Si el usuario ya respondió una pregunta anterior, avanza.
- Si estás en cierre, puedes mencionar casualmente que fue atendido por un bot con IA y que ese servicio también se ofrece, pero sin sonar vendedor agresivo.
`;

  const userPrompt = `
Resumen previo: ${resumen || "sin resumen"}
Último tema: ${ultimoTema || "sin tema"}
Necesidad: ${necesidad || "sin detectar"}
Mensaje nuevo del cliente: ${incomingText}
`;

  try {
    const response: any = await openai.responses.create({
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

    return minimalFallback({ nombre, vecesContacto });
  } catch (error) {
    console.error("generateAssistantReply error:", error);
    return minimalFallback({ nombre, vecesContacto });
  }
}

function getStageInstruction(vecesContacto: number): string {
  if (vecesContacto <= 1) {
    return "Detecta rápido la necesidad y haz una pregunta directa para entender qué quiere lograr.";
  }

  if (vecesContacto === 2) {
    return "Da una recomendación clara y concreta, sin rodeos, y cierra con una sola pregunta útil.";
  }

  if (vecesContacto === 3) {
    return "Da otra recomendación clara y concreta, sin rodeos, y cierra con una sola pregunta útil.";
  }

  if (vecesContacto === 4) {
    return "Propón una solución y menciona el resultado esperado, como más leads, ventas o visibilidad. Cierra con una sola pregunta natural.";
  }

  return "Haz cierre directo. Pregunta si quiere que lo contacten por llamada. Si hay avance suficiente, confírmalo de forma natural. Puedes mencionar casualmente que fue atendido por un bot con IA y que ese servicio también se ofrece.";
}

function minimalFallback({
  nombre,
  vecesContacto,
}: {
  nombre: string;
  vecesContacto: number;
}): string {
  if (vecesContacto >= 5) {
    return nombre
      ? `Perfecto, ${nombre}. Con lo que ya vimos, lo más práctico es seguirlo por llamada. ¿Quieres que te contacten por esa vía?`
      : "Con lo que ya vimos, lo más práctico es seguirlo por llamada. ¿Quieres que te contacten por esa vía?";
  }

  if (vecesContacto === 4) {
    return nombre
      ? `Perfecto, ${nombre}. Aquí ya conviene aterrizar una solución para ayudarte a generar más movimiento real. ¿Te gustaría que lo revisemos por llamada?`
      : "Aquí ya conviene aterrizar una solución para ayudarte a generar más movimiento real. ¿Te gustaría que lo revisemos por llamada?";
  }

  if (vecesContacto === 3) {
    return nombre
      ? `Perfecto, ${nombre}. Aquí lo importante es enfocarlo bien desde el inicio. ¿Hoy cómo te llegan más clientes?`
      : "Aquí lo importante es enfocarlo bien desde el inicio. ¿Hoy cómo te llegan más clientes?";
  }

  return nombre
    ? `Perfecto, ${nombre}. Cuéntame qué te gustaría lograr primero y te digo por dónde conviene empezar.`
    : "Perfecto. Cuéntame qué te gustaría lograr primero y te digo por dónde conviene empezar.";
}

function normalizeReply(text: string): string {
  return String(text || "")
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

async function updateContactSummaryWithAI({
  contacto,
  userMessage,
  botReply,
}: {
  contacto: ContactoRow | null;
  userMessage: string;
  botReply: string;
}): Promise<void> {
  if (!supabase || !contacto?.id) return;

  const previousSummary = cleanText(contacto?.resumen || "");
  const previousTopic = cleanText(contacto?.ultimo_tema || "");
  const previousNeed = cleanText(contacto?.necesidad || "");
  const previousStatus = cleanText(contacto?.estado || "Interesado");

  let memory: SummaryMemory = {
    resumen: previousSummary,
    ultimo_tema: previousTopic,
    necesidad: previousNeed,
    estado: (["Interesado", "Evaluando", "Llamar"].includes(previousStatus)
      ? (previousStatus as SummaryMemory["estado"])
      : "Interesado"),
  };

  if (OPENAI_API_KEY) {
    try {
      const prompt = `
Analiza la conversación y actualiza la memoria comercial del contacto.

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
  "resumen": "",
  "ultimo_tema": "",
  "necesidad": "",
  "estado": ""
}

REGLAS:
- estado debe ser solo uno de estos valores:
Interesado
Evaluando
Llamar
- No pongas markdown.
- No pongas texto antes o después del JSON.
- Resume de forma compacta y útil para ventas.
`;

      const response: any = await openai.responses.create({
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
      const parsed = safeJsonParse(raw);

      if (
        parsed &&
        parsed.resumen !== undefined &&
        parsed.ultimo_tema !== undefined &&
        parsed.necesidad !== undefined &&
        ["Interesado", "Evaluando", "Llamar"].includes(parsed.estado)
      ) {
        memory = parsed as SummaryMemory;
      }
    } catch (error) {
      console.error("updateContactSummaryWithAI error:", error);
    }
  }

  const { error } = await supabase
    .from("contactos")
    .update({
      resumen: memory.resumen,
      ultimo_tema: memory.ultimo_tema,
      necesidad: memory.necesidad,
      estado: memory.estado,
    })
    .eq("id", contacto.id);

  if (error) {
    console.error("updateContactSummaryWithAI supabase error:", error.message);
  }
}

function safeJsonParse(value: string): Record<string, any> | null {
  try {
    return JSON.parse(value);
  } catch {
    const firstBrace = String(value || "").indexOf("{");
    const lastBrace = String(value || "").lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(String(value).slice(firstBrace, lastBrace + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function sendWhatsAppText(to: string, body: string): Promise<any> {
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