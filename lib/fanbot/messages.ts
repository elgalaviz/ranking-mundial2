export function welcomeMessage(name: string): string {
  return `¡Hola ${name}! 👋 Soy FanBot, tu guía del Mundial 2026 🏆

Ya te inscribí a las alertas — 15 min antes de cada partido te aviso con info del juego y jugadores a seguir.

¿Tienes alguna pregunta del mundial? Tienes 5 consultas gratis al día 🎯`;
}

export function limitReachedMessage(_appUrl?: string): string {
  return (
    `Has alcanzado tu límite de consultas gratuitas por hoy. 😔\n\n` +
    `Próximamente podrás comprar *FanBot Premium* en:\n` +
    `👉 www.mifanbot.com/premium\n\n` +
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
  sponsor?: string
): string {
  const ganancia = Math.round(apuesta * momio);
  const sponsorPart = sponsor
    ? `En *${sponsor}* hubieras ganado *$${ganancia} pesos* 💰`
    : `Si apuestas $${apuesta} y aciertas, hubieras ganado *$${ganancia} pesos* 💰`;
  return (
    `🔒 ¡Pronóstico guardado! Apostaste por *${equipoElegido}*.\n\n` +
    `${sponsorPart}\n\n` +
    `_🎮 Solo entretenimiento · Sin dinero real_\n\n` +
    `Te aviso cuando termine el partido. ⚽`
  );
}

export function pronoAcertoMessage(
  partido: string,
  equipoElegido: string,
  momio: number,
  apuesta = 200,
  sponsor?: string
): string {
  const ganancia = Math.round(apuesta * momio);
  const sponsorPart = sponsor
    ? `En *${sponsor}* hubieras ganado *$${ganancia} pesos* 🤑`
    : `Hubieras ganado *$${ganancia} pesos* 🤑`;
  return (
    `⚽ *¡Acertaste el pronóstico!*\n\n` +
    `*${partido}*\n\n` +
    `Tu apuesta por *${equipoElegido}* fue correcta.\n\n` +
    `${sponsorPart}\n\n` +
    `_🎮 Solo entretenimiento · Sin dinero real_`
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
