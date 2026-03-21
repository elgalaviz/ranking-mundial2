import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export async function generateReply({
  systemPrompt,
  userPrompt,
}: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
  if (!OPENAI_API_KEY) {
    return "Gracias por escribirnos. En breve te apoyamos con tu solicitud.";
  }

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return "Gracias por escribirnos. En breve te apoyamos con tu solicitud.";
    }

    return content;
  } catch (error) {
    console.error("Error generando reply con OpenAI:", error);
    return "Gracias por escribirnos. En breve te apoyamos con tu solicitud.";
  }
}