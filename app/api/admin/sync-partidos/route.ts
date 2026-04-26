// POST /api/admin/sync-partidos
// Descarga todos los fixtures del Mundial 2026 desde API-Football
// y los inserta/actualiza en la tabla `partidos` de Supabase.
// Solo se llama una vez (o cuando se publique el calendario oficial).

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getFixtures } from "@/lib/api-football/client";
import { fixtureToPartido } from "@/lib/api-football/mappers";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "rene.galaviz@gmail.com";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST() {
  const auth = await createServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fixtures = await getFixtures();

    if (!fixtures || fixtures.length === 0) {
      return NextResponse.json({ ok: false, msg: "API-Football no devolvió partidos. Verifica la key y el league/season." });
    }

    const supabase = getSupabase();
    const rows = fixtures.map(fixtureToPartido);

    // upsert: si el partido ya existe (por fecha+equipos), lo actualiza
    const { error, count } = await supabase
      .from("partidos")
      .upsert(rows, {
        onConflict: "equipo_local,equipo_visitante,fecha_utc",
        ignoreDuplicates: false,
      });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      sincronizados: fixtures.length,
      insertados_o_actualizados: count,
    });
  } catch (err) {
    console.error("sync-partidos error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
