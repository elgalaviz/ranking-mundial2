import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

type Business = {
  name?: string | null;
};

type Contacto = {
  resumen?: string | null;
  ultimo_tema?: string | null;
  necesidad?: string | null;
  estado?: string | null;
  nombre?: string | null;
  sitio_web?: string | null;
  tipo_negocio?: string | null;
  presupuesto?: string | null;
  datos_extra?: string | null;
};

export type MemoryExtraction = {
  resumen: string;
  ultimo_tema: string;
  necesidad: string;
  estado: "interesado" | "llamar";
  nombre: string;
  sitio_web: string;
  tipo_negocio: string;
  presupuesto: string;
  datos_extra: string;
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
    return fallback(contacto, incomingMessage);
  }

  // ✅ PROMPT SIMPLIFICADO Y MÁS DIRECTO
  const prompt = `Eres un asistente que extrae información de conversaciones de WhatsApp para un CRM.

NEGOCIO: ${business?.name || "Negocio"}

INFORMACIÓN ACTUAL DEL CLIENTE:
${JSON.stringify({
  nombre: contacto.nombre || "Desconocido",
  sitio_web: contacto.sitio_web || "",
  tipo_negocio: contacto.tipo_negocio || "",
  presupuesto: contacto.presupuesto || "",
  resumen: contacto.resumen || "",
  ultimo_tema: contacto.ultimo_tema || "",
  necesidad: contacto.necesidad || "",
  estado: contacto.estado || "interesado",
  datos_extra: contacto.datos_extra || ""
}, null, 2)}

ÚLTIMO MENSAJE DEL CLIENTE:
"${incomingMessage}"

RESPUESTA DEL BOT:
"${assistantReply}"

INSTRUCCIONES:
1. Actualiza SOLO los campos que cambien con nueva información
2. Conserva la información anterior si no hay cambios
3. NO uses texto de ejemplo como "historial acumulable breve"
4. Escribe contenido real basado en la conversación

REGLAS PARA EL CAMPO "estado":
- Usa "llamar" si el cliente:
  * Acepta que lo llamen ("sí", "claro", "dale", "ok", "perfecto")
  * Pide una llamada ("llámenme", "quiero que me llamen")
  * Da fecha/hora para llamar ("lunes a las 10", "mañana", etc)
- Usa "interesado" en todos los demás casos

REGLAS PARA OTROS CAMPOS:
- "resumen": Resume brevemente el historial de la conversación (máx 2 oraciones)
- "ultimo_tema": El tema específico del último mensaje (máx 10 palabras)
- "necesidad": El servicio/producto que busca el cliente
- "nombre": Solo si se presenta en la conversación
- "sitio_web": Solo si menciona su URL
- "tipo_negocio": Solo si dice a qué se dedica
- "presupuesto": Solo si el CLIENTE lo menciona espontáneamente
- "datos_extra": Cualquier detalle relevante adicional

Devuelve SOLO un objeto JSON válido sin markdown ni explicaciones:`;

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.1,
      max_tokens: 300,
      messages: [
        { 
          role: "system", 
          content: "Eres un extractor de datos CRM. Analizas conversaciones y devuelves JSON con información actualizada del cliente. NUNCA uses texto de ejemplo o plantillas genéricas. Escribe contenido real basado en la conversación." 
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" }, // ✅ FORZAR RESPUESTA JSON
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || "{}";
    const parsed = safeJsonParse(raw);

    // ✅ VALIDACIÓN: Si sigue devolviendo texto de ejemplo, usar fallback inteligente
    const isTemplateText = (text: string) => {
      const templates = [
        "historial acumulable breve",
        "tema corto del último mensaje",
        "qué quiere el cliente",
        "nombre si lo mencionó"
      ];
      return templates.some(t => text?.toLowerCase().includes(t.toLowerCase()));
    };

    return {
      resumen: isTemplateText(parsed?.resumen) 
        ? (contacto.resumen || `Cliente preguntó sobre ${incomingMessage.slice(0, 50)}`)
        : String(parsed?.resumen || contacto.resumen || `Cliente preguntó sobre ${incomingMessage.slice(0, 50)}`),
      
      ultimo_tema: isTemplateText(parsed?.ultimo_tema)
        ? incomingMessage.slice(0, 50)
        : String(parsed?.ultimo_tema || incomingMessage.slice(0, 50)),
      
      necesidad: String(parsed?.necesidad || contacto.necesidad || ""),
      
      estado: normalizeEstado(parsed?.estado || contacto.estado || "interesado"),
      
      nombre: String(parsed?.nombre || contacto.nombre || ""),
      sitio_web: String(parsed?.sitio_web || contacto.sitio_web || ""),
      tipo_negocio: String(parsed?.tipo_negocio || contacto.tipo_negocio || ""),
      presupuesto: String(parsed?.presupuesto || contacto.presupuesto || ""),
      datos_extra: String(parsed?.datos_extra || contacto.datos_extra || ""),
    };
  } catch (error) {
    console.error("Error extrayendo memoria:", error);
    return fallback(contacto, incomingMessage);
  }
}

function fallback(contacto: Contacto, incomingMessage: string): MemoryExtraction {
  return {
    resumen: contacto.resumen || `Cliente preguntó: ${incomingMessage.slice(0, 100)}`,
    ultimo_tema: incomingMessage.slice(0, 50),
    necesidad: contacto.necesidad || "",
    estado: normalizeEstado(contacto.estado || "interesado"),
    nombre: contacto.nombre || "",
    sitio_web: contacto.sitio_web || "",
    tipo_negocio: contacto.tipo_negocio || "",
    presupuesto: contacto.presupuesto || "",
    datos_extra: contacto.datos_extra || "",
  };
}

export function normalizeEstado(estado: string): "interesado" | "llamar" {
  const v = String(estado || "").toLowerCase().trim();
  if (v === "llamar") return "llamar";
  return "interesado";
}

function safeJsonParse(input: string) {
  try {
    return JSON.parse(input);
  } catch {
    const cleaned = input.replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
    try { return JSON.parse(cleaned); } catch { return {}; }
  }
}