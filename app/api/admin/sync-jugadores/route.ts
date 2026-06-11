import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const API_KEY = process.env.API_FOOTBALL_KEY!;
const BASE_URL = "https://v3.football.api-sports.io";
const LEAGUE_ID = 1;
const SEASON = 2026;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "x-apisports-key": API_KEY },
    cache: "no-store",
  });
  const json = await res.json();
  return json as T;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type ApiPlayer = {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number | null;
    photo: string | null;
  };
  statistics: Array<{
    team: { id: number; name: string; logo: string };
    games: {
      position: string | null;
      number: number | null;
    };
  }>;
};

type ApiPlayersResponse = {
  response: ApiPlayer[];
  paging: { current: number; total: number };
};

export async function GET() {
  const auth = await createServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  try {
    // 1. Obtener todos los jugadores del Mundial 2026 paginando
    const allPlayers: ApiPlayer[] = [];

    // Primera página para saber cuántas hay
    const first = await apiFetch<ApiPlayersResponse>(
      `/players?league=${LEAGUE_ID}&season=${SEASON}&page=1`
    );

    if (!first.response || !Array.isArray(first.response)) {
      return NextResponse.json({ ok: false, error: "API no devolvió jugadores", raw: first }, { status: 500 });
    }

    allPlayers.push(...first.response);

    const totalPages = first.paging?.total ?? 1;

    // Páginas restantes
    for (let page = 2; page <= totalPages; page++) {
      await sleep(300);
      const data = await apiFetch<ApiPlayersResponse>(
        `/players?league=${LEAGUE_ID}&season=${SEASON}&page=${page}`
      );
      if (data.response && Array.isArray(data.response)) {
        allPlayers.push(...data.response);
      }
    }

    if (allPlayers.length === 0) {
      return NextResponse.json({ ok: false, error: "La API no devolvió jugadores" }, { status: 500 });
    }

    // 2. Extraer equipos únicos de las estadísticas de los jugadores
    const teamsMap = new Map<number, { id: number; nombre: string; logo_url: string }>();
    for (const entry of allPlayers) {
      const team = entry.statistics?.[0]?.team;
      if (team) {
        teamsMap.set(team.id, { id: team.id, nombre: team.name, logo_url: team.logo });
      }
    }

    const teams = [...teamsMap.values()];

    // 3. Upsert selecciones
    const { error: teamsError } = await supabase
      .from("selecciones")
      .upsert(teams, { onConflict: "id" });
    if (teamsError) throw new Error(`Error upsert selecciones: ${teamsError.message}`);

    // 4. Construir lista de jugadores y hacer upsert
    const jugadores = allPlayers
      .filter(entry => entry.statistics?.[0]?.team?.id)
      .map(entry => {
        const stats = entry.statistics[0];
        return {
          id: entry.player.id,
          team_id: stats.team.id,
          nombre: entry.player.name,
          posicion: stats.games.position ?? null,
          numero: stats.games.number ?? null,
          edad: entry.player.age ?? null,
          foto_url: entry.player.photo ?? null,
        };
      });

    const { error } = await supabase
      .from("jugadores")
      .upsert(jugadores, { onConflict: "id" });

    if (error) throw new Error(`Error upsert jugadores: ${error.message}`);

    // 5. Resumen por equipo
    const porEquipo: Record<string, number> = {};
    for (const j of jugadores) {
      const nombre = teamsMap.get(j.team_id)?.nombre ?? String(j.team_id);
      porEquipo[nombre] = (porEquipo[nombre] || 0) + 1;
    }

    return NextResponse.json({
      ok: true,
      paginas: totalPages,
      selecciones: teams.length,
      jugadores: jugadores.length,
      por_equipo: porEquipo,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
