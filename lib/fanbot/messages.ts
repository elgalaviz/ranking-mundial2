export function welcomeMessage(name: string): string {
  return `¡Hola ${name}! 👋 Soy FanBot, tu asistente de fútbol ⚽

Ya te inscribí a las alertas — 15 min antes de cada partido te aviso con info del juego, estadio y en qué canales verlo 📺

¿Tienes alguna pregunta del mundial? Tienes 5 consultas gratis al día 🎯`;
}

export function limitReachedMessage(_appUrl?: string): string {
  return (
    `Has alcanzado tu límite de consultas gratuitas por hoy. 😔\n\n` +
    `Próximamente podrás comprar *FanBot Premium* en:\n` +
    `👉 www.mifanbot.com/fanbot/\n\n` +
    `¡Nos vemos mañana!`
  );
}

export function unknownMessage(): string {
  return `No entendí tu mensaje. Puedes preguntarme cualquier cosa sobre el Mundial 2026 ⚽`;
}

export function pronoGuardadoMessage(
  equipoElegido: string,
  momio: number,
  apuesta = 200,
  sponsor?: string,
  appUrl?: string
): string {
  const tieneOdds = momio > 1.0;
  let sponsorPart = "";
  if (tieneOdds) {
    const ganancia = Math.round(apuesta * momio);
    sponsorPart = sponsor
      ? `Si apostaras $${apuesta} en *${sponsor}*, podrías ganar hasta *$${ganancia} pesos* 🎰\n\n_Solo entretenimiento · Apuesta responsablemente_ 🎮\n\n`
      : `Con un momio de *x${momio.toFixed(2)}*, en tu casa de apuestas favorita $${apuesta} se convertirían en *$${ganancia}* 🎰\n\n_Solo entretenimiento · Apuesta responsablemente_ 🎮\n\n`;
  }
  const verLink = appUrl ? `\n\n📋 Ver mis pronósticos: ${appUrl.replace(/\/$/, "")}/pronosticos` : "";
  return (
    `🔒 ¡Pronóstico guardado! Tu pick: *${equipoElegido}*.\n\n` +
    sponsorPart +
    `Te aviso cuando termine el partido. ⚽` +
    verLink
  );
}

export function pronoAcertoMessage(
  partido: string,
  equipoElegido: string,
  sponsor?: string
): string {
  const sponsorPart = sponsor ? `\n_Pronóstico patrocinado por ${sponsor}_` : "";
  return (
    `⚽ *¡Acertaste el pronóstico!*\n\n` +
    `*${partido}*\n\n` +
    `Tu apuesta por *${equipoElegido}* fue correcta. 🎯${sponsorPart}`
  );
}

export function pronoFalloMessage(
  partido: string,
  equipoElegido: string,
  resultadoReal: string
): string {
  return (
    `⚽ *Resultado: ${partido}*\n\n` +
    `Tu pronóstico era *${equipoElegido}* pero el resultado fue *${resultadoReal}*.\n\n` +
    `¡Ánimo, el siguiente va! 💪`
  );
}
