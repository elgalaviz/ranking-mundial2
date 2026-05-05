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

export async function GET() {
  const auth = await createServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fixtures = await getFixtures();
    if (!fixtures || fixtures.length === 0) {
      return NextResponse.json({ ok: false, msg: "API-Football no devolvió partidos." });
    }

    const supabase = getSupabase();
    const { data: existentes } = await supabase
      .from("partidos")
      .select("id, equipo_local, equipo_visitante, jornada, fase, estadio, ciudad");

    const existentesMap = new Map(
      (existentes ?? []).map((p) => [`${p.equipo_local}|${p.equipo_visitante}`, p])
    );

    const diffs: {
      partido_id: string | null;
      equipo_local: string;
      equipo_visitante: string;
      es_nuevo: boolean;
      cambios: { campo: string; anterior: string | null; nuevo: string | null }[];
    }[] = [];

    for (const f of fixtures) {
      const row = fixtureToPartido(f);
      const key = `${row.equipo_local}|${row.equipo_visitante}`;
      const existente = existentesMap.get(key);

      if (existente) {
        const cambios: { campo: string; anterior: string | null; nuevo: string | null }[] = [];
        const campos = ["jornada", "fase", "estadio", "ciudad"] as const;
        for (const campo of campos) {
          const ant = String(existente[campo] ?? "");
          const nvo = String(row[campo] ?? "");
          if (ant !== nvo) cambios.push({ campo, anterior: existente[campo] ?? null, nuevo: (row as any)[campo] ?? null });
        }
        if (cambios.length > 0) {
          diffs.push({ partido_id: existente.id, equipo_local: row.equipo_local, equipo_visitante: row.equipo_visitante, es_nuevo: false, cambios });
        }
      } else {
        diffs.push({
          partido_id: null,
          equipo_local: row.equipo_local,
          equipo_visitante: row.equipo_visitante,
          es_nuevo: true,
          cambios: [],
        });
      }
    }

    return NextResponse.json({ ok: true, total_api: fixtures.length, diffs });
  } catch (err: any) {
    const msg = err?.message || err?.details || err?.hint || JSON.stringify(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
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
