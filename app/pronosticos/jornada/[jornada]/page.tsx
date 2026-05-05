"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type Partido = {
  id: string;
  equipo_local: string;
  equipo_visitante: string;
  fecha_utc: string;
  estadio: string | null;
  ciudad: string | null;
  fase: string | null;
  grupo: string | null;
  goles_local: number | null;
  goles_visitante: number | null;
};

type PronoExistente = {
  equipo_local: string;
  equipo_visitante: string;
  pronostico: "local" | "empate" | "visitante";
  acerto: boolean | null;
};

const FLAG_CODES: Record<string, string> = {
  "México": "mx", "Estados Unidos": "us", "USA": "us", "Canadá": "ca",
  "Brasil": "br", "Argentina": "ar", "Colombia": "co", "Uruguay": "uy",
  "Ecuador": "ec", "Chile": "cl", "Paraguay": "py", "Bolivia": "bo",
  "Perú": "pe", "Venezuela": "ve", "Costa Rica": "cr", "Honduras": "hn",
  "Guatemala": "gt", "Panamá": "pa", "El Salvador": "sv", "Jamaica": "jm",
  "Trinidad y Tobago": "tt", "Cuba": "cu", "España": "es", "Francia": "fr",
  "Alemania": "de", "Portugal": "pt", "Inglaterra": "gb-eng", "Italia": "it",
  "Países Bajos": "nl", "Bélgica": "be", "Croacia": "hr", "Serbia": "rs",
  "Suiza": "ch", "Dinamarca": "dk", "Austria": "at", "Escocia": "gb-sct",
  "Polonia": "pl", "Ucrania": "ua", "Turquía": "tr", "Hungría": "hu",
  "República Checa": "cz", "Chequia": "cz", "Eslovenia": "si", "Eslovaquia": "sk",
  "Rumania": "ro", "Grecia": "gr", "Noruega": "no", "Suecia": "se",
  "Marruecos": "ma", "Senegal": "sn", "Nigeria": "ng", "Ghana": "gh",
  "Camerún": "cm", "Egipto": "eg", "Costa de Marfil": "ci", "Mali": "ml",
  "Argelia": "dz", "Túnez": "tn", "Sudáfrica": "za",
  "República Democrática del Congo": "cd", "RD Congo": "cd",
  "Japón": "jp", "Corea del Sur": "kr", "Australia": "au",
  "Arabia Saudita": "sa", "Irán": "ir", "Irak": "iq", "Qatar": "qa",
  "China": "cn", "Uzbekistán": "uz", "Indonesia": "id", "Nueva Zelanda": "nz",
  "Haití": "ht", "Curazao": "cw",
};

function Flag({ equipo }: { equipo: string }) {
  const code = FLAG_CODES[equipo];
  if (!code) return null;
  return (
    <img
      src={`https://flagcdn.com/w20/${code}.png`}
      srcSet={`https://flagcdn.com/w40/${code}.png 2x`}
      width={20} height={14}
      alt={equipo}
      className="inline-block rounded-sm object-cover"
    />
  );
}

function formatFecha(utc: string) {
  return new Date(utc).toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

const OPCIONES: { key: "local" | "empate" | "visitante"; label: string }[] = [
  { key: "local", label: "Local" },
  { key: "empate", label: "Empate" },
  { key: "visitante", label: "Visita" },
];

const ESTADO_BADGE: Record<string, string> = {
  local: "🏠",
  empate: "🤝",
  visitante: "✈️",
};

function PartidoCard({
  partido,
  prono,
  onPick,
}: {
  partido: Partido;
  prono: PronoExistente | null;
  onPick: (equipo_local: string, equipo_visitante: string, fecha_partido: string, pronostico: "local" | "empate" | "visitante") => Promise<void>;
}) {
  const [saving, setSaving] = useState<string | null>(null);
  const [current, setCurrent] = useState<"local" | "empate" | "visitante" | null>(prono?.pronostico ?? null);
  const [acerto, setAcerto] = useState<boolean | null>(prono?.acerto ?? null);

  const bloqueado = new Date(partido.fecha_utc) < new Date();
  const terminado = partido.goles_local !== null && partido.goles_visitante !== null;

  const handlePick = async (opcion: "local" | "empate" | "visitante") => {
    if (bloqueado || saving) return;
    setSaving(opcion);
    try {
      await onPick(partido.equipo_local, partido.equipo_visitante, partido.fecha_utc, opcion);
      setCurrent(opcion);
      setAcerto(null);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${bloqueado ? "opacity-70" : "border-gray-200"}`}>
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        {partido.fase && (
          <span className="text-xs bg-[#006847]/10 text-[#006847] font-medium px-2 py-0.5 rounded-full">
            {partido.fase}{partido.grupo ? ` · Grupo ${partido.grupo}` : ""}
          </span>
        )}
        <span className="text-xs text-gray-400 ml-auto">{formatFecha(partido.fecha_utc)}</span>
      </div>

      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Flag equipo={partido.equipo_local} />
          <span className="font-bold text-gray-800 text-sm truncate">{partido.equipo_local}</span>
        </div>

        {terminado ? (
          <div className="text-center shrink-0">
            <span className="text-xl font-black text-gray-800">
              {partido.goles_local} – {partido.goles_visitante}
            </span>
          </div>
        ) : (
          <span className="text-gray-400 text-xs font-medium shrink-0">vs</span>
        )}

        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
          <span className="font-bold text-gray-800 text-sm truncate text-right">{partido.equipo_visitante}</span>
          <Flag equipo={partido.equipo_visitante} />
        </div>
      </div>

      {partido.ciudad && (
        <p className="text-xs text-gray-400 text-center pb-1">{partido.estadio ? `${partido.estadio} · ` : ""}{partido.ciudad}</p>
      )}

      <div className="px-4 pb-4 pt-2">
        {bloqueado && !current ? (
          <p className="text-center text-xs text-gray-400 py-2">⏱️ Partido bloqueado</p>
        ) : (
          <div className="flex gap-2">
            {OPCIONES.map((op) => {
              const isSelected = current === op.key;
              const label = op.key === "local" ? partido.equipo_local.split(" ")[0]
                : op.key === "visitante" ? partido.equipo_visitante.split(" ")[0]
                : "Empate";
              const isSaving = saving === op.key;

              let style = "border-gray-200 text-gray-600 hover:border-[#006847] hover:text-[#006847]";
              if (isSelected) {
                if (acerto === true) style = "border-green-500 bg-green-50 text-green-700";
                else if (acerto === false) style = "border-red-400 bg-red-50 text-red-600";
                else style = "border-[#006847] bg-[#006847] text-white";
              }

              return (
                <button
                  key={op.key}
                  onClick={() => handlePick(op.key)}
                  disabled={bloqueado || !!saving}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border-2 transition-all ${style} disabled:cursor-not-allowed`}
                >
                  {isSaving ? "..." : (
                    <>
                      <span className="block text-base leading-none">{ESTADO_BADGE[op.key]}</span>
                      <span className="block mt-0.5 truncate px-1">{label}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {current && isSelected(current) && (
          <p className="text-center text-xs text-gray-400 mt-2">
            {acerto === true ? "✅ Acertaste" : acerto === false ? "❌ Fallaste" : `Tu pick: ${ESTADO_BADGE[current]}`}
          </p>
        )}
      </div>
    </div>
  );

  function isSelected(v: string) { return v === current; }
}

export default function JornadaPage() {
  const params = useParams();
  const router = useRouter();
  const jornada = Number(params.jornada);

  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [pronos, setPronos] = useState<Map<string, PronoExistente>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pronoKey = (local: string, visitante: string) => `${local}|${visitante}`;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/pronosticos/jornada?jornada=${jornada}`)
      .then(async (res) => {
        if (res.status === 401) { router.push(`/quiniela/login?next=/pronosticos/jornada/${jornada}`); return; }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setPartidos(data.partidos ?? []);
        const map = new Map<string, PronoExistente>();
        (data.pronos ?? []).forEach((p: PronoExistente) => {
          map.set(pronoKey(p.equipo_local, p.equipo_visitante), p);
        });
        setPronos(map);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [jornada, router]);

  const handlePick = useCallback(async (
    equipo_local: string,
    equipo_visitante: string,
    fecha_partido: string,
    pronostico: "local" | "empate" | "visitante"
  ) => {
    const res = await fetch("/api/pronosticos/pick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipo_local, equipo_visitante, fecha_partido, pronostico }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "No se pudo guardar");
    }
  }, []);

  const totalPicks = pronos.size;
  const totalPartidos = partidos.length;

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-[#006847] shadow-md">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/mifanbot-h.svg" alt="MiFanBot" width={120} height={32} />
          </Link>
          <Link href="/pronosticos" className="text-white text-sm font-medium hover:underline">
            Mis pronósticos
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Tabs jornadas */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((j) => (
            <Link
              key={j}
              href={`/pronosticos/jornada/${j}`}
              className={`flex-1 py-2.5 text-sm font-bold text-center rounded-xl border-2 transition-colors ${
                j === jornada
                  ? "border-[#006847] bg-[#006847] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-[#006847]"
              }`}
            >
              Jornada {j}
            </Link>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-black text-gray-800">Jornada {jornada}</h1>
          {!loading && totalPartidos > 0 && (
            <span className="text-sm text-gray-500">
              {totalPicks}/{totalPartidos} pronosticados
            </span>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#006847] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
        )}

        {!loading && !error && partidos.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
            No hay partidos para esta jornada.
          </div>
        )}

        {!loading && !error && partidos.length > 0 && (
          <>
            {/* Barra de progreso */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3 mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Progreso</span>
                <span className="font-bold text-[#006847]">{totalPicks} / {totalPartidos}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-[#006847] h-2 rounded-full transition-all"
                  style={{ width: totalPartidos > 0 ? `${(totalPicks / totalPartidos) * 100}%` : "0%" }}
                />
              </div>
            </div>

            {/* Agrupados por día */}
            {Object.entries(
              partidos.reduce<Record<string, Partido[]>>((acc, p) => {
                const key = new Date(p.fecha_utc).toLocaleDateString("es-MX", {
                  timeZone: "America/Mexico_City",
                  weekday: "long", day: "numeric", month: "long",
                });
                if (!acc[key]) acc[key] = [];
                acc[key].push(p);
                return acc;
              }, {})
            ).map(([dia, juegos]) => (
              <div key={dia} className="mb-6">
                <h2 className="text-xs font-bold text-gray-400 tracking-wider mb-3 capitalize">
                  {dia}
                </h2>
                <div className="space-y-3">
                  {juegos.map((p) => (
                    <PartidoCard
                      key={p.id}
                      partido={p}
                      prono={pronos.get(pronoKey(p.equipo_local, p.equipo_visitante)) ?? null}
                      onPick={handlePick}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </main>
  );
}
