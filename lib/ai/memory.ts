import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

type Contacto = {
  resumen?: string | null;
  ultimo_tema?: string | null;
  nombre?: string | null;
};

export type MemoryExtraction = {
  resumen: string;
  ultimo_tema: string;
  nombre: string;
};

export async function extractMemory({
  contacto,
  incomingMessage,
  assistantReply,
}: {
  contacto: Contacto;
  incomingMessage: string;
  assistantReply: string;
}) : Promise<MemoryExtraction> {
  if (!OPENAI_API_KEY) {
    return fallback(contacto, incomingMessage);
  }

  const prompt = `Eres un asistente que extrae información clave de una conversación de WhatsApp entre un fanático del fútbol y un bot experto en el Mundial 2026.

INFORMACIÓN ACTUAL DEL CONTACTO:
${JSON.stringify({
  nombre: contacto.nombre || "Desconocido",
  resumen: contacto.resumen || "Sin conversación previa.",
  ultimo_tema: contacto.ultimo_tema || "Sin tema previo.",
}, null, 2)}

ÚLTIMO INTERCAMBIO:
- Fanático: "${incomingMessage}"
- Bot: "${assistantReply}"

INSTRUCCIONES:
1. Actualiza los campos con la nueva información relevante.
2. Conserva la información anterior si no hay cambios.
3. El objetivo es mantener un contexto útil para futuras conversaciones sobre el Mundial.

REGLAS PARA LOS CAMPOS:
- "resumen": Actualiza el resumen de la conversación de forma muy breve (1-2 oraciones). Debe ser acumulativo.
- "ultimo_tema": Identifica el tema principal del último intercambio (ej: "partido de México", "calendario", "resultados grupo A"). Máximo 10 palabras.
- "nombre": Extrae el nombre del fanático solo si se presenta explícitamente en este último intercambio. Si no, conserva el anterior.

Devuelve SOLO un objeto JSON válido sin markdown ni explicaciones, con el siguiente formato:
{
  "resumen": "...",
  "ultimo_tema": "...",
  "nombre": "..."
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.1,
      max_tokens: 250,
      messages: [
        { 
          role: "system", 
          content: "Eres un extractor de datos para un CRM de un bot de fútbol. Analizas conversaciones y devuelves un objeto JSON con el resumen, último tema y nombre del contacto. Escribe contenido real basado en la conversación." 
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || "{}";
    const parsed = safeJsonParse(raw);

    return {
      resumen: String(parsed?.resumen || contacto.resumen || `Fan preguntó sobre ${incomingMessage.slice(0, 50)}`),
      ultimo_tema: String(parsed?.ultimo_tema || incomingMessage.slice(0, 50)),
      nombre: String(parsed?.nombre || contacto.nombre || ""),
    };
  } catch (error) {
    console.error("Error extrayendo memoria:", error);
    return fallback(contacto, incomingMessage);
  }
}

function fallback(contacto: Contacto, incomingMessage: string): MemoryExtraction {
  return {
    resumen: contacto.resumen || `Fan preguntó: ${incomingMessage.slice(0, 100)}`,
    ultimo_tema: incomingMessage.slice(0, 50),
    nombre: contacto.nombre || "",
  };
}

function safeJsonParse(input: string) {
  try {
    return JSON.parse(input);
  } catch {
    const cleaned = input.replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
    try { return JSON.parse(cleaned); } catch { return {}; }
  }
}