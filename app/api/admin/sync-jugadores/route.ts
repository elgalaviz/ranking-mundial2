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

type SquadPlayer = {
  id: number;
  name: string;
  age: number | null;
  number: number | null;
  position: string | null;
  photo: string | null;
};

type SquadResponse = {
  team: { id: number; name: string; logo: string };
  players: SquadPlayer[];
};

export async function GET() {
  const auth = await createServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  try {
    // 1. Obtener equipos del Mundial desde fixtures
    type Fixture = { teams: { home: { id: number; name: string; logo: string }; away: { id: number; name: string; logo: string } } };
    type FixturesResponse = { response: Fixture[] };
    const fixturesData = await apiFetch<FixturesResponse>(`/fixtures?league=${LEAGUE_ID}&season=${SEASON}`);
    const fixtures = fixturesData.response ?? [];

    const teamsMap = new Map<number, { id: number; nombre: string; logo_url: string }>();
    for (const f of fixtures) {
      const { home, away } = f.teams;
      teamsMap.set(home.id, { id: home.id, nombre: home.name, logo_url: home.logo });
      teamsMap.set(away.id, { id: away.id, nombre: away.name, logo_url: away.logo });
    }
    const teams = [...teamsMap.values()];

    if (teams.length === 0) {
      return NextResponse.json({ ok: false, error: "No se encontraron equipos en la API" }, { status: 500 });
    }

    // 2. Upsert selecciones
    const { error: teamsError } = await supabase
      .from("selecciones")
      .upsert(teams, { onConflict: "id" });
    if (teamsError) throw new Error(`Error upsert selecciones: ${teamsError.message}`);

    // 3. Para cada equipo, traer squad y upsert jugadores (máx 26 por equipo = squad oficial WC)
    let totalJugadores = 0;
    const errores: string[] = [];
    const porEquipo: Record<string, number> = {};

    for (const team of teams) {
      try {
        type SquadApiResponse = { response: SquadResponse[] };
        const data = await apiFetch<SquadApiResponse>(`/players/squads?team=${team.id}`);
        const players = (data.response?.[0]?.players ?? []).slice(0, 26);

        if (players.length === 0) continue;

        const jugadores = players.map((p) => ({
          id: p.id,
          team_id: team.id,
          nombre: p.name,
          posicion: p.position ?? null,
          numero: p.number ?? null,
          edad: p.age ?? null,
          foto_url: p.photo ?? null,
        }));

        const { error } = await supabase
          .from("jugadores")
          .upsert(jugadores, { onConflict: "id" });

        if (error) {
          errores.push(`${team.nombre}: ${error.message}`);
        } else {
          totalJugadores += jugadores.length;
          porEquipo[team.nombre] = jugadores.length;
        }

        await sleep(200);
      } catch (e) {
        errores.push(`${team.nombre}: ${String(e)}`);
      }
    }

    return NextResponse.json({
      ok: true,
      selecciones: teams.length,
      jugadores: totalJugadores,
      por_equipo: porEquipo,
      errores: errores.length > 0 ? errores : undefined,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
