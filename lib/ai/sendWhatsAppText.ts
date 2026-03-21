export async function sendWhatsAppText({
  accessToken,
  phoneNumberId,
  to,
  body,
}: {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  body: string;
}) {
  if (!accessToken || !phoneNumberId) {
    return { ok: false, error: "Falta accessToken o phoneNumberId" };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
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
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data };
    }

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error };
  }
}