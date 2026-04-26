// API-Football v3 — api-sports.io
// Docs: https://www.api-football.com/documentation-v3
// Base URL: https://v3.football.api-sports.io

const BASE_URL = "https://v3.football.api-sports.io";

// FIFA World Cup 2026: league=1, season=2026  (confirmado en docs)
export const WORLD_CUP_LEAGUE_ID = 1;
export const WORLD_CUP_SEASON = 2026;

// Todos los status codes disponibles
// NS=No iniciado | 1H=Primer tiempo | HT=Medio tiempo | 2H=Segundo tiempo
// ET=Tiempo extra | BT=Break extra time | P=Penales en juego
// FT=Terminado | AET=Terminado en TE | PEN=Terminado en penales
// PST=Postponed | CANC=Cancelado | SUSP=Suspendido | ABD=Abandonado
export type FixtureStatus =
  | "NS" | "TBD"
  | "1H" | "HT" | "2H" | "ET" | "BT" | "P"
  | "FT" | "AET" | "PEN"
  | "PST" | "CANC" | "SUSP" | "ABD" | "WO" | "AWD";

// Status agrupados para queries
const LIVE_STATUSES   = "1H-HT-2H-ET-BT-P";
const FINISH_STATUSES = "FT-AET-PEN";        // todos los terminados

export type ApiFixture = {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;           // ISO 8601 UTC  ej: "2026-06-11T18:00:00+00:00"
    timestamp: number;
    periods: { first: number | null; second: number | null };
    venue: { id: number | null; name: string | null; city: string | null };
    status: {
      long: string;
      short: FixtureStatus;
      elapsed: number | null;
      extra: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    round: string;          // "Group Stage - 1", "Round of 16", "Final", etc.
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime:  { home: number | null; away: number | null };
    fulltime:  { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty:   { home: number | null; away: number | null };
  };
};

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string): Promise<T> {
  const API_KEY = process.env.API_FOOTBALL_KEY;
  if (!API_KEY) throw new Error("API_FOOTBALL_KEY no está configurada en .env.local");

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "x-apisports-key": API_KEY,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API-Football HTTP ${res.status}: ${text}`);
  }

  const json = await res.json();

  // La API devuelve errores dentro del cuerpo aunque el status sea 200
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`API-Football error: ${JSON.stringify(json.errors)}`);
  }

  return json.response as T;
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

/** Todos los fixtures del Mundial 2026 (104 partidos) */
export async function getFixtures(): Promise<ApiFixture[]> {
  return apiFetch<ApiFixture[]>(
    `/fixtures?league=${WORLD_CUP_LEAGUE_ID}&season=${WORLD_CUP_SEASON}`
  );
}

/** Partidos en vivo del Mundial (estados: 1H, HT, 2H, ET, BT, P) */
export async function getLiveFixtures(): Promise<ApiFixture[]> {
  return apiFetch<ApiFixture[]>(
    `/fixtures?league=${WORLD_CUP_LEAGUE_ID}&status=${LIVE_STATUSES}`
  );
}

/** Partidos terminados del Mundial 2026 (FT, AET, PEN) */
export async function getFinishedFixtures(): Promise<ApiFixture[]> {
  return apiFetch<ApiFixture[]>(
    `/fixtures?league=${WORLD_CUP_LEAGUE_ID}&season=${WORLD_CUP_SEASON}&status=${FINISH_STATUSES}`
  );
}

/** Un partido específico por su ID de API-Football */
export async function getFixtureById(fixtureId: number): Promise<ApiFixture | null> {
  const data = await apiFetch<ApiFixture[]>(`/fixtures?id=${fixtureId}`);
  return data[0] ?? null;
}

/** Cuota restante del plan (evita gastar requests de más) */
export async function checkQuota(): Promise<{
  plan: string;
  requests_remaining: number;
  requests_limit: number;
}> {
  const API_KEY = process.env.API_FOOTBALL_KEY || "";
  const res = await fetch(`${BASE_URL}/status`, {
    headers: { "x-apisports-key": API_KEY },
    cache: "no-store",
  });
  const json = await res.json();
  return {
    plan:               json.response?.subscription?.plan ?? "unknown",
    requests_remaining: json.response?.requests?.current ?? 0,
    requests_limit:     json.response?.requests?.limit_day ?? 0,
  };
}
