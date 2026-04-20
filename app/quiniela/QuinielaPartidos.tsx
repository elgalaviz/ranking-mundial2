"use client";

import { useState, useEffect } from "react";

type Partido = {
  id: string;
  equipo_local: string;
  equipo_visitante: string;
  fecha_utc: string;
  estadio: string | null;
  ciudad: string | null;
  fase: string | null;
  grupo: string | null;
  jornada: number | null;
};

// Mapa de nombre de equipo → código ISO 2 letras (para flagcdn.com)
const FLAG_CODES: Record<string, string> = {
  "México": "mx", "Estados Unidos": "us", "USA": "us", "Canadá": "ca",
  "Brasil": "br", "Argentina": "ar", "Colombia": "co", "Uruguay": "uy",
  "Ecuador": "ec", "Chile": "cl", "Paraguay": "py", "Bolivia": "bo",
  "Perú": "pe", "Venezuela": "ve",
  "Costa Rica": "cr", "Honduras": "hn", "Guatemala": "gt", "Panamá": "pa",
  "El Salvador": "sv", "Jamaica": "jm", "Trinidad y Tobago": "tt", "Cuba": "cu",
  "España": "es", "Francia": "fr", "Alemania": "de", "Portugal": "pt",
  "Inglaterra": "gb-eng", "Italia": "it", "Países Bajos": "nl", "Bélgica": "be",
  "Croacia": "hr", "Serbia": "rs", "Suiza": "ch", "Dinamarca": "dk",
  "Austria": "at", "Escocia": "gb-sct", "Gales": "gb-wls", "Polonia": "pl",
  "Ucrania": "ua", "Turquía": "tr", "Hungría": "hu",
  "República Checa": "cz", "Chequia": "cz",
  "Eslovenia": "si", "Eslovaquia": "sk", "Albania": "al", "Rumania": "ro",
  "Grecia": "gr", "Noruega": "no", "Suecia": "se", "Finlandia": "fi",
  "Bosnia-Herzegovina": "ba", "Bosnia y Herzegovina": "ba",
  "Marruecos": "ma", "Senegal": "sn", "Nigeria": "ng", "Ghana": "gh",
  "Camerún": "cm", "Egipto": "eg", "Costa de Marfil": "ci", "Mali": "ml",
  "Argelia": "dz", "Túnez": "tn", "Sudáfrica": "za", "Angola": "ao",
  "Zambia": "zm", "República Democrática del Congo": "cd",
  "Japón": "jp", "Corea del Sur": "kr", "Australia": "au",
  "Arabia Saudita": "sa", "Irán": "ir", "Irak": "iq", "Qatar": "qa",
  "China": "cn", "Uzbekistán": "uz", "Jordania": "jo", "Omán": "om",
  "Emiratos Árabes": "ae", "Indonesia": "id", "Nueva Zelanda": "nz",
  "Catar": "qa", "Haití": "ht", "Haiti": "ht", "Curazao": "cw",
};

function FlagImg({ equipo, className = "" }: { equipo: string; className?: string }) {
  const code = FLAG_CODES[equipo];
  if (!code) return null;
  return (
    <img
      src={`https://flagcdn.com/w20/${code}.png`}
      srcSet={`https://flagcdn.com/w40/${code}.png 2x`}
      width={20}
      height={14}
      alt={equipo}
      className={`inline-block rounded-sm object-cover ${className}`}
    />
  );
}

type Pick = { local: string; visitante: string };
type PicksMap = Record<string, Pick>;
type SavedMap = Record<string, boolean>;

function formatFecha(utc: string) {
  return new Date(utc).toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDayKey(utc: string) {
  return new Date(utc).toLocaleDateString("es-MX", {
    timeZone: "America/Mexico_City",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isLocked(fecha_utc: string) {
  return new Date(fecha_utc).getTime() - Date.now() < 5 * 60 * 1000;
}

export default function QuinielaPartidos({
  partidos,
  userId,
}: {
  partidos: Partido[];
  userId: string;
}) {
  const [picks, setPicks] = useState<PicksMap>({});
  const [saved, setSaved] = useState<SavedMap>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/quiniela/picks")
      .then((r) => r.json())
      .then((data: { partido_id: string; pick_local: number; pick_visit: number }[]) => {
        if (!Array.isArray(data)) return;
        const loaded: PicksMap = {};
        const savedInit: SavedMap = {};
        data.forEach((p) => {
          loaded[p.partido_id] = {
            local: String(p.pick_local),
            visitante: String(p.pick_visit),
          };
          savedInit[p.partido_id] = true;
        });
        setPicks(loaded);
        setSaved(savedInit);
      })
      .catch(() => {});
  }, []);

  const handleChange = (id: string, side: "local" | "visitante", value: string) => {
    const num = value.replace(/\D/g, "").slice(0, 2);
    setPicks((prev) => ({
      ...prev,
      [id]: { ...prev[id], [side]: num },
    }));
    setSaved((prev) => ({ ...prev, [id]: false }));
  };

  const handleSave = async (partido: Partido) => {
    const pick = picks[partido.id];
    if (!pick || pick.local === "" || pick.visitante === "") return;

    setSaving(partido.id);
    setError((prev) => ({ ...prev, [partido.id]: "" }));

    try {
      const res = await fetch("/api/quiniela/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partido_id: partido.id,
          goles_local: parseInt(pick.local),
          goles_visitante: parseInt(pick.visitante),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo guardar.");
      }

      setSaved((prev) => ({ ...prev, [partido.id]: true }));
    } catch (err: any) {
      setError((prev) => ({ ...prev, [partido.id]: err.message }));
    } finally {
      setSaving(null);
    }
  };

  if (partidos.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        No hay partidos próximos disponibles.
      </div>
    );
  }

  const grouped = partidos.reduce<Record<string, Partido[]>>((acc, p) => {
    const key = p.jornada ? `Jornada ${p.jornada}` : getDayKey(p.fecha_utc);
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([day, dayPartidos]) => (
        <div key={day}>
          <h2 className="text-sm font-semibold text-gray-500 tracking-wider mb-3">
            {day}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {dayPartidos.map((partido) => {
              const locked = isLocked(partido.fecha_utc);
              const pick = picks[partido.id] ?? { local: "", visitante: "" };
              const isSaving = saving === partido.id;
              const isSaved = saved[partido.id];
              const pickError = error[partido.id];
              const canSave =
                !locked &&
                pick.local !== "" &&
                pick.visitante !== "" &&
                !isSaved;

              return (
                <div
                  key={partido.id}
                  className={`bg-white rounded-xl border p-4 ${
                    locked ? "opacity-60 border-gray-200" : "border-gray-200 shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {partido.fase && (
                      <span className="text-xs bg-[#006847]/10 text-[#006847] font-medium px-2 py-0.5 rounded-full">
                        {partido.fase}
                        {partido.grupo ? ` · Grupo ${partido.grupo}` : ""}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">
                      {formatFecha(partido.fecha_utc)}
                    </span>
                    {locked && (
                      <span className="text-xs text-[#CE1126] font-medium">Bloqueado</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-right font-semibold text-gray-800 text-sm flex items-center justify-end gap-1.5 min-w-0">
                      <span className="truncate">{partido.equipo_local}</span>
                      <FlagImg equipo={partido.equipo_local} />
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={pick.local}
                        onChange={(e) => handleChange(partido.id, "local", e.target.value)}
                        disabled={locked || isSaving}
                        placeholder="–"
                        className="w-10 h-10 text-center font-bold text-lg border-2 border-gray-300 rounded-lg focus:border-[#006847] focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      <span className="text-gray-400 font-bold text-lg">:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={pick.visitante}
                        onChange={(e) => handleChange(partido.id, "visitante", e.target.value)}
                        disabled={locked || isSaving}
                        placeholder="–"
                        className="w-10 h-10 text-center font-bold text-lg border-2 border-gray-300 rounded-lg focus:border-[#006847] focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <span className="flex-1 font-semibold text-gray-800 text-sm flex items-center gap-1.5 min-w-0">
                      <FlagImg equipo={partido.equipo_visitante} />
                      <span className="truncate">{partido.equipo_visitante}</span>
                    </span>
                  </div>

                  {pickError && (
                    <p className="mt-2 text-xs text-red-600 text-right">{pickError}</p>
                  )}
                  {partido.ciudad && (
                    <p className="mt-2 text-xs text-gray-400 text-center">{partido.ciudad}</p>
                  )}

                  <div className="flex justify-center mt-2">
                    <button
                      onClick={() => handleSave(partido)}
                      disabled={!canSave || isSaving}
                      className={`text-xs font-medium px-4 py-1.5 rounded-lg transition-colors ${
                        isSaved
                          ? "bg-green-100 text-green-700 cursor-default"
                          : "bg-[#006847] text-white hover:bg-green-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                      }`}
                    >
                      {isSaving ? "..." : isSaved ? "Guardado" : "Guardar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
