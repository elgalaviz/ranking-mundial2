type Contacto = {
  resumen?: string | null;
  ultimo_tema?: string | null;
  necesidad?: string | null;
};

export function buildReplyPrompt({
  contacto,
  incomingMessage,
}: {
  contacto: Contacto;
  incomingMessage: string;
}) {
  return `
Cliente escribió:
"${incomingMessage}"

Resumen previo:
${contacto.resumen || "Sin historial"}

Último tema:
${contacto.ultimo_tema || "Sin tema"}

Necesidad detectada:
${contacto.necesidad || "Sin necesidad"}

Genera solo la respuesta que se enviará por WhatsApp.
`;
}