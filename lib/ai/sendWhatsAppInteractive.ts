// c:\Users\rene\Documents\ranking-mundial26\lib\ai\sendWhatsAppInteractive.ts

// Interfaz genérica para enviar cualquier tipo de mensaje
interface SendMessageParams {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  message: object;
}

async function sendWhatsAppMessage({ accessToken, phoneNumberId, to, message }: SendMessageParams) {
  const apiVersion = process.env.META_API_VERSION || "v22.0";
  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        ...message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error enviando mensaje de WhatsApp:", errorData);
      return { ok: false, error: errorData };
    }
    return { ok: true, data: await response.json() };
  } catch (error) {
    console.error("Fallo al enviar mensaje de WhatsApp:", error);
    return { ok: false, error };
  }
}

// --- Función específica para Botones de Respuesta (Reply Buttons) ---
interface ReplyButton {
  id: string;
  title: string;
}

export async function sendWhatsAppReplyButtons({ accessToken, phoneNumberId, to, body, buttons, footer }: { accessToken: string; phoneNumberId: string; to: string; body: string; buttons: ReplyButton[]; footer?: string }) {
  const interactive: Record<string, unknown> = {
    type: "button",
    body: { text: body },
    action: {
      buttons: buttons.slice(0, 3).map(btn => ({
        type: "reply",
        reply: { id: btn.id, title: btn.title.slice(0, 20) },
      })),
    },
  };
  if (footer) interactive.footer = { text: footer.slice(0, 60) };
  const message = { type: "interactive", interactive };
  return sendWhatsAppMessage({ accessToken, phoneNumberId, to, message });
}

// --- Función para enviar plantilla con botones de respuesta rápida ---
export async function sendWhatsAppTemplate({
  accessToken,
  phoneNumberId,
  to,
  templateName,
  languageCode = "es_MX",
  bodyParams = [],
  buttonPayload,
  buttonPayloads,
}: {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  templateName: string;
  languageCode?: string;
  bodyParams?: string[];
  buttonPayload?: string;
  buttonPayloads?: string[];
}) {
  const components: object[] = [];

  if (bodyParams.length > 0) {
    components.push({
      type: "body",
      parameters: bodyParams.map((p) => ({ type: "text", text: p })),
    });
  }

  // Soporte para múltiples botones
  const payloads = buttonPayloads ?? (buttonPayload ? [buttonPayload] : []);
  payloads.forEach((payload, index) => {
    components.push({
      type: "button",
      sub_type: "quick_reply",
      index: String(index),
      parameters: [{ type: "payload", payload }],
    });
  });

  const message = {
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  };

  return sendWhatsAppMessage({ accessToken, phoneNumberId, to, message });
}

// --- Función específica para Mensajes de Lista (List Messages) ---
interface ListRow {
    id: string;
    title: string;
    description?: string;
}

interface ListSection {
    title: string;
    rows: ListRow[];
}

export async function sendWhatsAppListMessage({ accessToken, phoneNumberId, to, body, buttonText, sections }: { accessToken: string; phoneNumberId: string; to: string; body: string; buttonText: string; sections: ListSection[] }) {
    const message = {
        type: "interactive",
        interactive: {
            type: "list",
            body: { text: body },
            action: {
                button: buttonText,
                sections: sections.slice(0, 10).map(section => ({
                    title: section.title,
                    rows: section.rows.slice(0, 10).map(row => ({
                        id: row.id,
                        title: row.title,
                        description: row.description || '',
                    }))
                }))
            }
        }
    };
    return sendWhatsAppMessage({ accessToken, phoneNumberId, to, message });
}
