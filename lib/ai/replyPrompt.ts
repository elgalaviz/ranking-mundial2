type Contacto = {
  resumen?: string | null;
  ultimo_tema?: string | null;
  nombre?: string | null;
};

export function buildReplyPrompt({
  contacto,
  incomingMessage,
}: {
  contacto: Contacto;
  incomingMessage: string;
}) {
  return `
El fanático escribió:
"${incomingMessage}"

---
Breve resumen de la conversación hasta ahora:
${contacto.resumen || "Sin historial."}

Último tema de la conversación:
${contacto.ultimo_tema || "Sin tema."}
---

Genera solo la respuesta que se enviará por WhatsApp.
`;
}