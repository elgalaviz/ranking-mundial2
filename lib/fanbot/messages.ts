export function welcomeMessage(name: string): string {
  return `¡Hola ${name}! 👋 Soy FanBot, tu guía del Mundial 2026 🏆

Ya te inscribí a las alertas — 15 min antes de cada partido te aviso con info del juego y jugadores a seguir.

¿Tienes alguna pregunta del mundial? Tienes 3 consultas gratis al día 🎯`;
}

export function limitReachedMessage(): string {
  return `Hoy ya usaste tus 3 consultas gratis 😅

Mañana se reinician automáticamente. Si quieres acceso ilimitado escribe *PREMIUM* y te cuento cómo.`;
}

export function unknownMessage(): string {
  return `No entendí tu mensaje. Puedes preguntarme cualquier cosa sobre el Mundial 2026 ⚽`;
}
