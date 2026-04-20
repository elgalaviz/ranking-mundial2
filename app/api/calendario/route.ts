import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function formatICSDate(utc: string): string {
  return new Date(utc).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function sanitize(str: string): string {
  return (str || "").replace(/[,;\\]/g, "\\$&").replace(/\n/g, "\\n");
}

export async function GET() {
  const supabase = getSupabase();

  const { data: partidos, error } = await supabase
    .from("partidos")
    .select("*")
    .order("fecha_utc", { ascending: true });

  if (error || !partidos) {
    return new NextResponse("Error obteniendo partidos", { status: 500 });
  }

  const now = formatICSDate(new Date().toISOString());

  const eventos = partidos.map((p: Record<string, string>) => {
    const start = formatICSDate(p.fecha_utc);
    const end = formatICSDate(
      new Date(new Date(p.fecha_utc).getTime() + 2 * 60 * 60 * 1000).toISOString()
    );

    const titulo = `⚽ ${sanitize(p.equipo_local)} vs ${sanitize(p.equipo_visitante)}`;
    const lugar = [p.estadio, p.ciudad].filter(Boolean).map(sanitize).join(", ");
    const descripcion = [
      p.fase ? `Fase: ${sanitize(p.fase)}` : "",
      p.grupo ? `Grupo: ${p.grupo}` : "",
      lugar ? `Sede: ${lugar}` : "",
      "FanBot Mundial 26 — rankingmundial2.vercel.app",
    ].filter(Boolean).join("\\n");

    const uid = `partido-${p.id}@rankingmundial26`;

    return [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${titulo}`,
      `DESCRIPTION:${descripcion}`,
      lugar ? `LOCATION:${lugar}` : "",
      "BEGIN:VALARM",
      "TRIGGER:-PT15M",
      "ACTION:DISPLAY",
      `DESCRIPTION:⚽ ¡En 15 min arranca! ${sanitize(p.equipo_local)} vs ${sanitize(p.equipo_visitante)}`,
      "END:VALARM",
      "END:VEVENT",
    ].filter(Boolean).join("\r\n");
  });

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ranking Mundial 26//FanBot//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Mundial 2026 ⚽",
    "X-WR-TIMEZONE:America/Mexico_City",
    "X-WR-CALDESC:Todos los partidos del Mundial 2026 con alertas 15 min antes.",
    ...eventos,
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="mundial2026.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
