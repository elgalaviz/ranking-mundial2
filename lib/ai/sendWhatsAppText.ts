export async function sendWhatsAppDocument({
  accessToken,
  phoneNumberId,
  to,
  link,
  filename,
  caption,
}: {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  link: string;
  filename: string;
  caption?: string;
}) {
  if (!accessToken || !phoneNumberId) return { ok: false, error: "Falta token" };
  const apiVersion = process.env.META_API_VERSION || "v22.0";
  const res = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "document",
        document: { link, filename, caption },
      }),
    }
  );
  const data = await res.json();
  return res.ok ? { ok: true, data } : { ok: false, error: data };
}

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
    const apiVersion = process.env.META_API_VERSION || "v22.0";
    const res = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
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