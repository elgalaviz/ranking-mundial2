"use client";

import { useEffect, useState } from "react";

type Liga = {
  id: string;
  nombre: string;
  tier: number;
  max_participantes: number;
  codigo: string;
  estado: string;
  owner_nombre: string;
  owner_phone: string;
  created_at: string;
  liga_miembros: { count: number }[];
};

function formatDate(d: string) {
  return new Date(d).toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const ESTADO_STYLE: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  activa: "bg-green-100 text-green-700",
  cancelada: "bg-red-100 text-red-600",
};

export default function GodQuinielaPage() {
  const [ligas, setLigas] = useState<Liga[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchLigas() {
    setLoading(true);
    const res = await fetch("/api/admin/ligas");
    const data = await res.json();
    setLigas(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function cambiarEstado(id: string, estado: string) {
    await fetch("/api/admin/ligas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado }),
    });
    fetchLigas();
  }

  useEffect(() => { fetchLigas(); }, []);

  const pendientes = ligas.filter(l => l.estado === "pendiente");
  const activas = ligas.filter(l => l.estado === "activa");

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Ligas Privadas</h1>
          <p className="text-sm text-gray-500">{ligas.length} ligas · {pendientes.length} pendientes de activar</p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="bg-amber-100 text-amber-700 font-semibold px-3 py-1 rounded-full">{pendientes.length} pendientes</span>
          <span className="bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full">{activas.length} activas</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Cargando...</div>
      ) : ligas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
          Aún no hay ligas registradas.
        </div>
      ) : (
        <div className="space-y-3">
          {ligas.map(liga => {
            const miembros = liga.liga_miembros?.[0]?.count ?? 0;
            return (
              <div key={liga.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-gray-800 text-base">{liga.nombre}</h2>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ESTADO_STYLE[liga.estado] ?? "bg-gray-100 text-gray-500"}`}>
                        {liga.estado}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                        ${liga.tier} · {liga.max_participantes} personas
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {liga.owner_nombre} · <span className="font-mono">{liga.owner_phone}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(liga.created_at)}</p>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-xs text-gray-500 font-mono bg-gray-50 px-3 py-1 rounded-lg inline-block">
                      {liga.codigo}
                    </p>
                    <p className="text-xs text-gray-400">{miembros} / {liga.max_participantes} miembros</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 flex-wrap">
                  {liga.estado === "pendiente" && (
                    <button
                      onClick={() => cambiarEstado(liga.id, "activa")}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-1.5 rounded-lg transition-colors"
                    >
                      ✓ Activar liga
                    </button>
                  )}
                  {liga.estado === "activa" && (
                    <button
                      onClick={() => cambiarEstado(liga.id, "cancelada")}
                      className="text-xs border border-red-200 hover:bg-red-50 text-red-500 font-medium px-4 py-1.5 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                  {liga.estado === "cancelada" && (
                    <button
                      onClick={() => cambiarEstado(liga.id, "activa")}
                      className="text-xs border border-gray-300 hover:bg-gray-50 text-gray-600 font-medium px-4 py-1.5 rounded-lg transition-colors"
                    >
                      Reactivar
                    </button>
                  )}
                  <a
                    href={`/quiniela/ligas/${liga.codigo}`}
                    target="_blank"
                    className="text-xs border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium px-4 py-1.5 rounded-lg transition-colors"
                  >
                    Ver ranking →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
