// GET /api/admin/test-api-football
// Verifica conexión con API-Football: cuota restante + muestra de fixtures.

import { NextResponse } from "next/server";
import { checkQuota, getFixtures } from "@/lib/api-football/client";

export async function GET() {
  try {
    // 1. Cuota — no cuenta contra el límite diario
    const quota = await checkQuota();

    // 2. Traer fixtures — 1 request
    const fixtures = await getFixtures();

    const muestra = fixtures.slice(0, 5).map((f) => ({
      id: f.fixture.id,
      fecha: f.fixture.date,
      local: f.teams.home.name,
      visitante: f.teams.away.name,
      fase: f.league.round,
      status: f.fixture.status.short,
    }));

    return NextResponse.json({
      ok: true,
      quota,
      total_fixtures: fixtures.length,
      muestra,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
