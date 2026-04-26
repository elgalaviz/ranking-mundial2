// The Odds API v4 — https://the-odds-api.com
// Plan gratuito: 500 requests/mes
// Sport key Mundial 2026: soccer_fifa_world_cup

const BASE_URL = "https://api.the-odds-api.com/v4";

export type OddsOutcome = {
  name: string;
  price: number; // decimal odds
};

export type OddsMarket = {
  key: string;       // "h2h" | "totals" | "spreads"
  outcomes: OddsOutcome[];
};

export type OddsBookmaker = {
  key: string;
  title: string;
  markets: OddsMarket[];
};

export type OddsEvent = {
  id: string;
  sport_key: string;
  commence_time: string; // ISO UTC
  home_team: string;
  away_team: string;
  bookmakers: OddsBookmaker[];
};

async function oddsFetch<T>(path: string): Promise<{ data: T; requests_remaining: string | null }> {
  const API_KEY = process.env.ODDS_API_KEY;
  if (!API_KEY) throw new Error("ODDS_API_KEY no configurada en .env.local");

  const res = await fetch(`${BASE_URL}${path}`, { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`The Odds API HTTP ${res.status}: ${text}`);
  }

  const data = await res.json() as T;
  const remaining = res.headers.get("x-requests-remaining");
  return { data, requests_remaining: remaining };
}

/** Momios del Mundial 2026 — mercado 1X2 (h2h) */
export async function getWorldCupOdds(): Promise<OddsEvent[]> {
  const { data } = await oddsFetch<OddsEvent[]>(
    `/sports/soccer_fifa_world_cup/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=eu,us&markets=h2h&oddsFormat=decimal`
  );
  return data;
}

/** Lista de deportes disponibles (para debug) */
export async function getSports(): Promise<{ key: string; title: string; active: boolean }[]> {
  const { data } = await oddsFetch<{ key: string; title: string; active: boolean }[]>(
    `/sports?apiKey=${process.env.ODDS_API_KEY}&all=true`
  );
  return data;
}

/** Requests restantes del plan */
export async function checkOddsQuota(): Promise<number | null> {
  const API_KEY = process.env.ODDS_API_KEY;
  const res = await fetch(`${BASE_URL}/sports?apiKey=${API_KEY}`, { cache: "no-store" });
  const remaining = res.headers.get("x-requests-remaining");
  return remaining ? parseInt(remaining) : null;
}

/** Formatea momios decimales a formato legible */
export function formatMomios(price: number): string {
  // Convertir a formato americano para contexto latam (ej: 1.65 → "+165" aprox)
  // Pero mejor mostrar decimal que es universal
  return price.toFixed(2);
}

/** Busca un partido por nombre de equipo (case-insensitive, parcial) */
export function findEventByTeam(events: OddsEvent[], team: string): OddsEvent | null {
  const t = team.toLowerCase();
  return events.find(
    (e) =>
      e.home_team.toLowerCase().includes(t) ||
      e.away_team.toLowerCase().includes(t)
  ) ?? null;
}
