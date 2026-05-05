"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type Pronostico = {
  id: string;
  equipo_local: string;
  equipo_visitante: string;
  pronostico: "local" | "empate" | "visitante";
  momio: number;
  fecha_partido: string | null;
  acerto: boolean | null;
  created_at: string;
};

const LABELS: Record<string, string> = {
  local: "🏠 Local",
  empate: "🤝 Empate",
  visitante: "✈️ Visitante",
};

function estadoBadge(acerto: boolean | null) {
  if (acerto === null) return <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⏳ Pendiente</span>;
  if (acerto) return <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Acertaste</span>;
  return <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">❌ Fallaste</span>;
}

function formatFecha(fecha: string | null) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-MX", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City",
  });
}

export default function PronosticosPage() {
  const router = useRouter();
  const [pronos, setPronos] = useState<Pronostico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/pronosticos")
      .then(async (res) => {
        if (res.status === 401) { router.push("/quiniela/login?next=/pronosticos"); return; }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al cargar");
        setPronos(data.pronosticos);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  const acertados = pronos.filter((p) => p.acerto === true).length;
  const resueltos = pronos.filter((p) => p.acerto !== null).length;
  const pendientes = pronos.filter((p) => p.acerto === null).length;

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-[#006847] shadow-md">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/mifanbot-h.svg" alt="MiFanBot" width={120} height={32} />
          </Link>
          <Link href="/quiniela" className="text-white text-sm font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">
            Pronosticar 1er Jornada
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Mis Pronósticos ⚽</h1>

        {!loading && !error && pronos.length > 0 && (
          <div className="flex gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3 flex-1 text-center">
              <div className="text-2xl font-bold text-[#006847]">{acertados}/{resueltos}</div>
              <div className="text-xs text-gray-500 mt-0.5">Aciertos</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3 flex-1 text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendientes}</div>
              <div className="text-xs text-gray-500 mt-0.5">Pendientes</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3 flex-1 text-center">
              <div className="text-2xl font-bold text-gray-700">{pronos.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">Total</div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#006847] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
        )}

        {!loading && !error && pronos.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            <div className="text-4xl mb-3">🎯</div>
            <p className="font-medium">Aún no tienes pronósticos</p>
            <p className="text-sm mt-1">Escríbele al bot por WhatsApp y te mandará botones para pronosticar los partidos.</p>
          </div>
        )}

        {!loading && !error && pronos.length > 0 && (
          <div className="space-y-3">
            {pronos.map((p) => {
              const elegido =
                p.pronostico === "local" ? p.equipo_local
                : p.pronostico === "visitante" ? p.equipo_visitante
                : "Empate";
              return (
                <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">
                        {p.equipo_local} vs {p.equipo_visitante}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{formatFecha(p.fecha_partido)}</div>
                    </div>
                    {estadoBadge(p.acerto)}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-700">
                    <span>Tu pronóstico: <strong>{elegido}</strong></span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500">{LABELS[p.pronostico]}</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500">{p.momio}x</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
