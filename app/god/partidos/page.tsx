"use client";

import { useEffect, useState } from "react";

type Partido = {
  id: string;
  equipo_local: string;
  equipo_visitante: string;
  fecha_utc: string;
  estadio: string | null;
  ciudad: string | null;
  fase: string | null;
  grupo: string | null;
  alerta_enviada: boolean;
};

const FASES = ["Grupos", "Ronda de 32", "Octavos", "Cuartos", "Semifinal", "Tercer lugar", "Final"];

export default function PartidosAdminPage() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Partido>>({});
  const [filterFase, setFilterFase] = useState<string>("Todos");
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState<Partial<Partido>>({ fase: "Grupos", alerta_enviada: false });

  useEffect(() => { fetchPartidos(); }, []);

  async function fetchPartidos() {
    setLoading(true);
    const res = await fetch("/api/admin/partidos");
    const data = await res.json();
    setPartidos(data);
    setLoading(false);
  }

  function startEdit(p: Partido) {
    setEditingId(p.id);
    setEditForm({ ...p });
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    await fetch("/api/admin/partidos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, ...editForm }),
    });
    setSaving(false);
    setEditingId(null);
    fetchPartidos();
  }

  async function deletePartido(id: string) {
    if (!confirm("¿Eliminar este partido?")) return;
    await fetch("/api/admin/partidos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchPartidos();
  }

  async function createPartido() {
    setSaving(true);
    await fetch("/api/admin/partidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    setSaving(false);
    setShowNew(false);
    setNewForm({ fase: "Grupos", alerta_enviada: false });
    fetchPartidos();
  }

  const filtered = filterFase === "Todos" ? partidos : partidos.filter(p => p.fase === filterFase);

  function formatFecha(utc: string) {
    return new Date(utc).toLocaleString("es-MX", {
      timeZone: "America/Mexico_City",
      day: "2-digit", month: "short",
      hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">⚽ Partidos Mundial 2026</h1>
          <button
            onClick={() => setShowNew(true)}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm font-medium"
          >
            + Nuevo partido
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["Todos", ...FASES].map(f => (
            <button
              key={f}
              onClick={() => setFilterFase(f)}
              className={`px-3 py-1 rounded text-sm ${filterFase === f ? "bg-green-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="text-sm text-gray-500 mb-3">{filtered.length} partidos · horarios en tiempo de CDMX</div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800">
                  <th className="pb-2 pr-4">Fecha CDMX</th>
                  <th className="pb-2 pr-4">Local</th>
                  <th className="pb-2 pr-4">Visitante</th>
                  <th className="pb-2 pr-4">Fase</th>
                  <th className="pb-2 pr-4">Grupo</th>
                  <th className="pb-2 pr-4">Ciudad</th>
                  <th className="pb-2 pr-4">Alerta</th>
                  <th className="pb-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-gray-900 hover:bg-gray-900">
                    {editingId === p.id ? (
                      <>
                        <td className="py-2 pr-4">
                          <input
                            type="datetime-local"
                            value={editForm.fecha_utc ? new Date(editForm.fecha_utc).toISOString().slice(0, 16) : ""}
                            onChange={e => setEditForm(f => ({ ...f, fecha_utc: new Date(e.target.value).toISOString() }))}
                            className="bg-gray-800 rounded px-2 py-1 text-xs w-44"
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <input value={editForm.equipo_local || ""} onChange={e => setEditForm(f => ({ ...f, equipo_local: e.target.value }))} className="bg-gray-800 rounded px-2 py-1 text-xs w-28" />
                        </td>
                        <td className="py-2 pr-4">
                          <input value={editForm.equipo_visitante || ""} onChange={e => setEditForm(f => ({ ...f, equipo_visitante: e.target.value }))} className="bg-gray-800 rounded px-2 py-1 text-xs w-28" />
                        </td>
                        <td className="py-2 pr-4">
                          <select value={editForm.fase || ""} onChange={e => setEditForm(f => ({ ...f, fase: e.target.value }))} className="bg-gray-800 rounded px-2 py-1 text-xs">
                            {FASES.map(f => <option key={f}>{f}</option>)}
                          </select>
                        </td>
                        <td className="py-2 pr-4">
                          <input value={editForm.grupo || ""} onChange={e => setEditForm(f => ({ ...f, grupo: e.target.value }))} className="bg-gray-800 rounded px-2 py-1 text-xs w-12" />
                        </td>
                        <td className="py-2 pr-4">
                          <input value={editForm.ciudad || ""} onChange={e => setEditForm(f => ({ ...f, ciudad: e.target.value }))} className="bg-gray-800 rounded px-2 py-1 text-xs w-32" />
                        </td>
                        <td className="py-2 pr-4">
                          <input type="checkbox" checked={editForm.alerta_enviada || false} onChange={e => setEditForm(f => ({ ...f, alerta_enviada: e.target.checked }))} />
                        </td>
                        <td className="py-2 flex gap-2">
                          <button onClick={saveEdit} disabled={saving} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs">Guardar</button>
                          <button onClick={() => setEditingId(null)} className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-xs">Cancelar</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 pr-4 text-gray-300">{formatFecha(p.fecha_utc)}</td>
                        <td className="py-2 pr-4 font-medium">{p.equipo_local}</td>
                        <td className="py-2 pr-4">{p.equipo_visitante}</td>
                        <td className="py-2 pr-4 text-gray-400">{p.fase}</td>
                        <td className="py-2 pr-4 text-gray-500">{p.grupo || "—"}</td>
                        <td className="py-2 pr-4 text-gray-400 text-xs">{p.ciudad}</td>
                        <td className="py-2 pr-4">
                          <span className={`text-xs px-2 py-0.5 rounded ${p.alerta_enviada ? "bg-green-900 text-green-400" : "bg-gray-800 text-gray-500"}`}>
                            {p.alerta_enviada ? "Enviada" : "Pendiente"}
                          </span>
                        </td>
                        <td className="py-2 flex gap-2">
                          <button onClick={() => startEdit(p)} className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-xs">Editar</button>
                          <button onClick={() => deletePartido(p.id)} className="bg-red-900 hover:bg-red-800 px-3 py-1 rounded text-xs">Eliminar</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal nuevo partido */}
        {showNew && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-bold mb-4">Nuevo partido</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Local</label>
                    <input value={newForm.equipo_local || ""} onChange={e => setNewForm(f => ({ ...f, equipo_local: e.target.value }))} className="bg-gray-800 rounded px-3 py-2 text-sm w-full" placeholder="México" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Visitante</label>
                    <input value={newForm.equipo_visitante || ""} onChange={e => setNewForm(f => ({ ...f, equipo_visitante: e.target.value }))} className="bg-gray-800 rounded px-3 py-2 text-sm w-full" placeholder="Argentina" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Fecha y hora (UTC)</label>
                  <input type="datetime-local" onChange={e => setNewForm(f => ({ ...f, fecha_utc: new Date(e.target.value).toISOString() }))} className="bg-gray-800 rounded px-3 py-2 text-sm w-full" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Fase</label>
                    <select value={newForm.fase || "Grupos"} onChange={e => setNewForm(f => ({ ...f, fase: e.target.value }))} className="bg-gray-800 rounded px-3 py-2 text-sm w-full">
                      {FASES.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Grupo</label>
                    <input value={newForm.grupo || ""} onChange={e => setNewForm(f => ({ ...f, grupo: e.target.value }))} className="bg-gray-800 rounded px-3 py-2 text-sm w-full" placeholder="A" maxLength={1} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Ciudad</label>
                  <input value={newForm.ciudad || ""} onChange={e => setNewForm(f => ({ ...f, ciudad: e.target.value }))} className="bg-gray-800 rounded px-3 py-2 text-sm w-full" placeholder="Ciudad de México" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Estadio</label>
                  <input value={newForm.estadio || ""} onChange={e => setNewForm(f => ({ ...f, estadio: e.target.value }))} className="bg-gray-800 rounded px-3 py-2 text-sm w-full" placeholder="Estadio Azteca" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={createPartido} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded text-sm font-medium">Crear</button>
                <button onClick={() => setShowNew(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
