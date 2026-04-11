import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

type Message = {
  role: "user" | "assistant";
  content: string;
};

export async function generateReply({
  systemPrompt,
  userPrompt,
  history = [],
}: {
  systemPrompt: string;
  userPrompt: string;
  history?: Message[];
}): Promise<string> {
  if (!OPENAI_API_KEY) {
    return "Gracias por escribirnos. En breve te apoyamos con tu solicitud.";
  }

  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: userPrompt },
    ];

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
        temperature: 0.7,
      max_tokens: 150, // ✅ Optimización: respuestas concisas para WhatsApp
      messages,
    });

    const content = completion.choices?.[0]?.message?.content?.trim();
    return content || "Gracias por escribirnos. En breve te apoyamos con tu solicitud.";
  } catch (error) {
    console.error("Error generando reply con OpenAI:", error);
    return "Gracias por escribirnos. En breve te apoyamos con tu solicitud.";
  }
}