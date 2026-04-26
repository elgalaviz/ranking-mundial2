// GET /api/admin/test-odds
// Verifica conexión con The Odds API y muestra partidos disponibles.

import { NextResponse } from "next/server";
import { getWorldCupOdds, getSports } from "@/lib/odds/client";

export async function GET() {
  try {
    // Deportes disponibles con "soccer_fifa" para ver qué sport keys hay
    const sports = await getSports();
    const soccerFifa = sports.filter((s) => s.key.includes("soccer_fifa") || s.key.includes("world_cup"));

    // Intentar traer momios del Mundial
    let events: Awaited<ReturnType<typeof getWorldCupOdds>> = [];
    let oddsError: string | null = null;
    try {
      events = await getWorldCupOdds();
    } catch (e) {
      oddsError = String(e);
    }

    return NextResponse.json({
      ok: true,
      soccer_fifa_sports: soccerFifa,
      world_cup_events: events.length,
      muestra: events.slice(0, 3).map((e) => ({
        partido: `${e.home_team} vs ${e.away_team}`,
        fecha: e.commence_time,
        casas: e.bookmakers.length,
        momios: e.bookmakers[0]?.markets[0]?.outcomes ?? [],
      })),
      odds_error: oddsError,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
