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

    // Traer partidos existentes para comparar por equipos
    const { data: existentes } = await supabase
      .from("partidos")
      .select("id, equipo_local, equipo_visitante");

    const existentesMap = new Map(
      (existentes ?? []).map((p) => [`${p.equipo_local}|${p.equipo_visitante}`, p.id])
    );

    let actualizados = 0;
    let insertados = 0;

    for (const f of fixtures) {
      const row = fixtureToPartido(f);
      const key = `${row.equipo_local}|${row.equipo_visitante}`;
      const idExistente = existentesMap.get(key);

      if (idExistente) {
        // Solo actualizar jornada, fase, estadio, ciudad — NO tocar fecha_utc ni alerta_enviada
        const { error } = await supabase
          .from("partidos")
          .update({
            jornada: row.jornada,
            fase: row.fase,
            estadio: row.estadio,
            ciudad: row.ciudad,
          })
          .eq("id", idExistente);

        if (!error) actualizados++;
      } else {
        // Nuevo partido: insertar completo
        const { error } = await supabase
          .from("partidos")
          .insert(row);

        if (!error) insertados++;
      }
    }

    return NextResponse.json({
      ok: true,
      total_api: fixtures.length,
      actualizados,
      insertados,
    });
  } catch (err: any) {
    console.error("sync-partidos error:", err);
    const msg = err?.message || err?.details || err?.hint || JSON.stringify(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
