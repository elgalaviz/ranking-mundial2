import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

type Business = {
  name?: string | null;
};

type Contacto = {
  resumen?: string | null;
  ultimo_tema?: string | null;
  necesidad?: string | null;
  estado?: string | null;
};

export type MemoryExtraction = {
  resumen: string;
  ultimo_tema: string;
  necesidad: string;
  estado: "interesado" | "llamar" | "contactado" | "cliente" | "perdido";
};

export async function extractMemory({
  business,
  contacto,
  incomingMessage,
  assistantReply,
}: {
  business?: Business | null;
  contacto: Contacto;
  incomingMessage: string;
  assistantReply: string;
}): Promise<MemoryExtraction> {
  if (!OPENAI_API_KEY) {
    return {
      resumen: incomingMessage,
      ultimo_tema: incomingMessage.slice(0, 120),
      necesidad: contacto.necesidad || "",
      estado: normalizeEstado(contacto.estado || "interesado"),
    };
  }

  const prompt = `
Analiza la conversación y devuelve únicamente JSON válido.

Negocio:
- Nombre: ${business?.name || "Negocio"}

Resumen previo:
${contacto.resumen || "Sin historial"}

Último tema previo:
${contacto.ultimo_tema || "Sin tema"}

Necesidad previa:
${contacto.necesidad || "Sin necesidad"}

Estado previo:
${contacto.estado || "interesado"}

Mensaje nuevo del cliente:
${incomingMessage}

Respuesta del bot:
${assistantReply}

Devuelve SOLO este JSON:
{
  "resumen": "",
  "ultimo_tema": "",
  "necesidad": "",
  "estado": "interesado"
}

Reglas:
- "estado" solo puede ser uno de estos:
  interesado, llamar, contactado, cliente, perdido
- "resumen" debe ser breve y acumulable
- "ultimo_tema" debe ser corto
- "necesidad" debe reflejar intención real del cliente
`;

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Eres un extractor de datos. Devuelve solo JSON válido, sin markdown.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || "{}";
    const parsed = safeJsonParse(raw);

    return {
      resumen: String(parsed?.resumen || incomingMessage),
      ultimo_tema: String(parsed?.ultimo_tema || incomingMessage.slice(0, 120)),
      necesidad: String(parsed?.necesidad || contacto.necesidad || ""),
      estado: normalizeEstado(parsed?.estado || contacto.estado || "interesado"),
    };
  } catch (error) {
    console.error("Error extrayendo memoria:", error);

    return {
      resumen: incomingMessage,
      ultimo_tema: incomingMessage.slice(0, 120),
      necesidad: contacto.necesidad || "",
      estado: normalizeEstado(contacto.estado || "interesado"),
    };
  }
}

export function normalizeEstado(
  estado: string
): "interesado" | "llamar" | "contactado" | "cliente" | "perdido" {
  const value = String(estado || "").toLowerCase().trim();

  if (value === "llamar") return "llamar";
  if (value === "contactado") return "contactado";
  if (value === "cliente") return "cliente";
  if (value === "perdido") return "perdido";
  return "interesado";
}

function safeJsonParse(input: string) {
  try {
    return JSON.parse(input);
  } catch {
    const cleaned = input
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      return {};
    }
  }
}