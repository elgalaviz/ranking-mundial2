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
  return json.response as T;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

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
    const fixtures = await apiFetch<Fixture[]>(`/fixtures?league=${LEAGUE_ID}&season=${SEASON}`);

    const teamsMap = new Map<number, { id: number; nombre: string; logo_url: string }>();
    for (const f of fixtures) {
      const { home, away } = f.teams;
      teamsMap.set(home.id, { id: home.id, nombre: home.name, logo_url: home.logo });
      teamsMap.set(away.id, { id: away.id, nombre: away.name, logo_url: away.logo });
    }
    const teams = [...teamsMap.values()];

    // 2. Upsert selecciones
    const { error: teamsError } = await supabase
      .from("selecciones")
      .upsert(teams, { onConflict: "id" });
    if (teamsError) throw new Error(`Error upsert selecciones: ${teamsError.message}`);

    // 3. Para cada equipo, traer squad y upsert jugadores
    let totalJugadores = 0;
    const errores: string[] = [];

    for (const team of teams) {
      try {
        type SquadResponse = { team: { id: number }; players: { id: number; name: string; age: number; number: number; position: string; photo: string }[] };
        const squads = await apiFetch<SquadResponse[]>(`/players/squads?team=${team.id}`);
        const players = squads[0]?.players ?? [];

        if (players.length === 0) continue;

        const jugadores = players.map((p) => ({
          id: p.id,
          team_id: team.id,
          nombre: p.name,
          posicion: p.position,
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
        }

        // Pausa para no saturar la API
        await sleep(200);
      } catch (e) {
        errores.push(`${team.nombre}: ${String(e)}`);
      }
    }

    return NextResponse.json({
      ok: true,
      selecciones: teams.length,
      jugadores: totalJugadores,
      errores: errores.length > 0 ? errores : undefined,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
