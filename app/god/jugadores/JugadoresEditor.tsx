"use client";

import { useState, useRef, useTransition } from "react";
import { Upload, X, Check, Loader2 } from "lucide-react";

type Jugador = {
  id: number;
  team_id: number;
  nombre: string;
  posicion: string | null;
  numero: number | null;
  edad: number | null;
  foto_url: string | null;
  foto_custom_url: string | null;
};

type Seleccion = {
  id: number;
  nombre: string;
  logo_url: string | null;
};

const POSICION_ES: Record<string, string> = {
  Goalkeeper: "Portero",
  Defender: "Defensa",
  Midfielder: "Medio",
  Attacker: "Delantero",
};

const POSICION_COLOR: Record<string, string> = {
  Goalkeeper: "#f59e0b",
  Defender:   "#3b82f6",
  Midfielder: "#10b981",
  Attacker:   "#ef4444",
};

const POSICIONES = ["Todas", "Goalkeeper", "Defender", "Midfielder", "Attacker"];

export default function JugadoresEditor({
  selecciones,
  jugadores,
}: {
  selecciones: Seleccion[];
  jugadores: Jugador[];
}) {
  const [teamFilter, setTeamFilter] = useState<number | "all">("all");
  const [posFilter, setPosFilter] = useState("Todas");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState<number | null>(null);
  const [fotos, setFotos] = useState<Record<number, string | null>>(
    Object.fromEntries(jugadores.map(j => [j.id, j.foto_custom_url]))
  );
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const filtered = jugadores.filter(j => {
    if (teamFilter !== "all" && j.team_id !== teamFilter) return false;
    if (posFilter !== "Todas" && j.posicion !== posFilter) return false;
    if (search && !j.nombre.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function handleUpload(jugadorId: number, file: File) {
    setUploading(jugadorId);
    const fd = new FormData();
    fd.append("foto", file);
    fd.append("jugador_id", String(jugadorId));
    try {
      const res = await fetch("/api/admin/jugadores", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFotos(f => ({ ...f, [jugadorId]: data.url }));
      showToast("Foto actualizada", true);
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setUploading(null);
    }
  }

  async function handleDelete(jugadorId: number) {
    setUploading(jugadorId);
    try {
      const res = await fetch("/api/admin/jugadores", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jugador_id: jugadorId }),
      });
      if (!res.ok) throw new Error("Error al eliminar foto");
      setFotos(f => ({ ...f, [jugadorId]: null }));
      showToast("Foto eliminada", true);
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setUploading(null);
    }
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.ok ? "bg-green-600" : "bg-red-600"}`}>
          {toast.ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar jugador..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 w-48"
        />
        <select
          value={teamFilter}
          onChange={e => setTeamFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
        >
          <option value="all">Todos los equipos</option>
          {selecciones.map(s => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
        <div className="flex gap-1">
          {POSICIONES.map(p => (
            <button
              key={p}
              onClick={() => setPosFilter(p)}
              className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
                posFilter === p
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p === "Todas" ? "Todas" : POSICION_ES[p]}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-400 self-center">{filtered.length} jugadores</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filtered.map(j => {
          const fotoActual = fotos[j.id] || j.foto_url;
          const tieneCustom = !!fotos[j.id];
          const posColor = POSICION_COLOR[j.posicion || ""] || "#6b7280";
          const isUploading = uploading === j.id;

          return (
            <div key={j.id} className="relative group">
              {/* Card Panini preview */}
              <div className="rounded-2xl overflow-hidden shadow border border-gray-200 bg-white" style={{ aspectRatio: "2/3" }}>
                <div className="relative h-4/5 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {fotoActual ? (
                    <img src={fotoActual} alt={j.nombre} className="w-full h-full object-cover object-top" />
                  ) : (
                    <span className="text-4xl">👤</span>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                  {tieneCustom && !isUploading && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full" title="Foto custom" />
                  )}
                </div>
                <div className="h-1/5 px-1 py-1 text-center" style={{ backgroundColor: posColor }}>
                  <p className="text-white text-[9px] font-black uppercase truncate leading-tight">
                    {j.nombre.split(" ").pop()}
                  </p>
                  {j.numero && <p className="text-white/70 text-[8px]">#{j.numero}</p>}
                </div>
              </div>

              {/* Overlay con acciones */}
              <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                <p className="text-white text-[10px] font-bold text-center leading-tight">{j.nombre}</p>
                <label className="cursor-pointer flex items-center gap-1 bg-white text-gray-900 text-[10px] font-bold px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                  <Upload className="w-3 h-3" />
                  Subir foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(j.id, file);
                      e.target.value = "";
                    }}
                  />
                </label>
                {tieneCustom && (
                  <button
                    onClick={() => handleDelete(j.id)}
                    disabled={isUploading}
                    className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Quitar custom
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p>No hay jugadores con ese filtro.</p>
        </div>
      )}
    </div>
  );
}
