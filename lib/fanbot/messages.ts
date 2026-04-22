export function welcomeMessage(name: string): string {
  return `¡Hola ${name}! 👋 Soy FanBot, tu guía del Mundial 2026 🏆

Ya te inscribí a las alertas — 15 min antes de cada partido te aviso con info del juego y jugadores a seguir.

¿Tienes alguna pregunta del mundial? Tienes 5 consultas gratis al día 🎯`;
}

export function limitReachedMessage(appUrl?: string): string {
  const url = appUrl || "https://rankingmundial26.com";
  return (
    `Has alcanzado tu límite de consultas gratuitas por hoy. 😔\n\n` +
    `¿Quieres consultas *ilimitadas* y participar en la *Quiniela Liga* del Mundial? ⭐\n` +
    `👉 Activa *FanBot Premium* aquí: ${url}/fanbot\n\n` +
    `¡Nos vemos mañana!`
  );
}

export function unknownMessage(): string {
  return `No entendí tu mensaje. Puedes preguntarme cualquier cosa sobre el Mundial 2026 ⚽`;
}
