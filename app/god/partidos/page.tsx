"use client";

import { useEffect, useState } from "react";
import { Pencil, Send } from "lucide-react";

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
  goles_local: number | null;
  goles_visitante: number | null;
  alerta_enviada: boolean;
};

const FASES = ["Grupos", "Dieciseisavos", "Octavos", "Cuartos", "Semifinal", "Tercer lugar", "Final"];


function getDayKey(utc: string) {
  return new Date(utc).toLocaleDateString("es-MX", {
    timeZone: "America/Mexico_City",
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export default function PartidosAdminPage() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Partido>>({});
  const [filterFase, setFilterFase] = useState<string>("Todos");
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState<Partial<Partido>>({ fase: "Grupos", jornada: 1, alerta_enviada: false });
  const [openDays, setOpenDays] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { fetchPartidos(); }, []);

  async function syncDesdeApi() {
    if (!confirm("¿Sincronizar calendario desde API-Football? Esto insertará o actualizará todos los partidos del Mundial 2026.")) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/sync-partidos", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        alert(`✅ Sincronización completa: ${data.sincronizados} partidos procesados.`);
        await fetchPartidos();
      } else {
        alert(`❌ Error: ${data.error || data.msg}`);
      }
    } catch (e) {
      alert("❌ Error de red al sincronizar.");
    } finally {
      setSyncing(false);
    }
  }

  async function fetchPartidos() {
    setLoading(true);
    const res = await fetch("/api/admin/partidos");
    const data = await res.json();
    setPartidos(data);
    setLoading(false);
  }

  function toggleDay(day: string) {
    setOpenDays(prev => {
      const next = new Set(prev);
      next.has(day) ? next.delete(day) : next.add(day);
      return next;
    });
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

  async function testAlerta(partidoId: string) {
    const res = await fetch("/api/admin/test-alerta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partido_id: partidoId }),
    });
    const data = await res.json();
    alert(res.ok ? `✅ Alerta de prueba enviada a ${data.enviado_a}` : `❌ Error: ${data.error}`);
  }

  async function calcularPuntos(partidoId: string) {
    const res = await fetch("/api/admin/calcular-puntos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partido_id: partidoId }),
    });
    const data = await res.json();
    alert(res.ok ? `✓ Puntos calculados: ${data.actualizados} picks actualizados` : `Error: ${data.error}`);
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

  // Agrupar por día
  const byDay: Record<string, Partido[]> = {};
  for (const p of filtered) {
    const day = getDayKey(p.fecha_utc);
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(p);
  }
  const days = Object.keys(byDay);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">⚽ Partidos Mundial 2026</h1>
          <div className="flex gap-2">
            <button
              onClick={syncDesdeApi}
              disabled={syncing}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium"
            >
              {syncing ? "Sincronizando..." : "⟳ Sync API-Football"}
            </button>
            <button
              onClick={() => setShowNew(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
            >
              + Nuevo partido
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["Todos", ...FASES].map(f => (
            <button
              key={f}
              onClick={() => setFilterFase(f)}
              className={`px-3 py-1 rounded text-sm border ${
                filterFase === f
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="text-sm text-gray-500 mb-4">{filtered.length} partidos · horarios CDMX</div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Cargando...</div>
        ) : (
          <div className="space-y-2">
            {days.map(day => (
              <div key={day} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Header acordeón */}
                <button
                  onClick={() => toggleDay(day)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-800 capitalize">{day}</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {byDay[day].length} partidos
                    </span>
                  </div>
                  <span className="text-gray-400 text-lg">{openDays.has(day) ? "▲" : "▼"}</span>
                </button>

                {/* Contenido */}
                {openDays.has(day) && (
                  <div className="border-t border-gray-100 divide-y divide-gray-100">
                    {byDay[day].map(p => (
                      <div key={p.id} className="px-5 py-3">
                        {editingId === p.id ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Local</label>
                              <input value={editForm.equipo_local || ""} onChange={e => setEditForm(f => ({ ...f, equipo_local: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 text-sm w-full" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Visitante</label>
                              <input value={editForm.equipo_visitante || ""} onChange={e => setEditForm(f => ({ ...f, equipo_visitante: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 text-sm w-full" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Fecha UTC</label>
                              <input type="date" value={editForm.fecha_utc ? new Date(editForm.fecha_utc).toISOString().slice(0, 10) : ""} onChange={e => setEditForm(f => {
                                const hora = f.fecha_utc ? new Date(f.fecha_utc).toISOString().slice(11, 16) : "00:00";
                                return { ...f, fecha_utc: new Date(`${e.target.value}T${hora}:00Z`).toISOString() };
                              })} className="border border-gray-300 rounded px-2 py-1 text-sm w-full" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Hora UTC</label>
                              <input type="time" value={editForm.fecha_utc ? new Date(editForm.fecha_utc).toISOString().slice(11, 16) : ""} onChange={e => setEditForm(f => {
                                const fecha = f.fecha_utc ? new Date(f.fecha_utc).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
                                return { ...f, fecha_utc: new Date(`${fecha}T${e.target.value}:00Z`).toISOString() };
                              })} className="border border-gray-300 rounded px-2 py-1 text-sm w-full" /></div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Ciudad</label>
                              <input value={editForm.ciudad || ""} onChange={e => setEditForm(f => ({ ...f, ciudad: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 text-sm w-full" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Estadio</label>
                              <input value={editForm.estadio || ""} onChange={e => setEditForm(f => ({ ...f, estadio: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 text-sm w-full" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Fase</label>
                              <select value={editForm.fase || ""} onChange={e => setEditForm(f => ({ ...f, fase: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 text-sm w-full">
                                {FASES.map(f => <option key={f}>{f}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Jornada</label>
                              <input type="number" min={1} value={editForm.jornada ?? ""} onChange={e => setEditForm(f => ({ ...f, jornada: parseInt(e.target.value) || null }))} className="border border-gray-300 rounded px-2 py-1 text-sm w-full" placeholder="1" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Resultado local</label>
                              <input type="number" min={0} value={editForm.goles_local ?? ""} onChange={e => setEditForm(f => ({ ...f, goles_local: e.target.value === "" ? null : parseInt(e.target.value) }))} className="border border-gray-300 rounded px-2 py-1 text-sm w-full" placeholder="–" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Resultado visitante</label>
                              <input type="number" min={0} value={editForm.goles_visitante ?? ""} onChange={e => setEditForm(f => ({ ...f, goles_visitante: e.target.value === "" ? null : parseInt(e.target.value) }))} className="border border-gray-300 rounded px-2 py-1 text-sm w-full" placeholder="–" />
                            </div>
                            <div className="col-span-2 flex gap-2 pt-1">
                              <button onClick={saveEdit} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm">Guardar</button>
                              <button onClick={() => setEditingId(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1.5 rounded text-sm">Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                              <span className="text-xs text-gray-400 w-12 shrink-0">{new Date(p.fecha_utc).toLocaleTimeString("es-MX", { timeZone: "America/Mexico_City", hour: "2-digit", minute: "2-digit" })}</span>
                              <span className="font-medium text-gray-800 truncate">{p.equipo_local}</span>
                              <span className="text-gray-400 text-xs">vs</span>
                              <span className="text-gray-700 truncate">{p.equipo_visitante}</span>
                              {p.grupo && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0">Gr. {p.grupo}</span>}
                              <span className="text-xs text-gray-400 truncate hidden sm:block">{p.ciudad}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {p.goles_local !== null && p.goles_visitante !== null && (
                                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  {p.goles_local} – {p.goles_visitante}
                                </span>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded-full ${p.alerta_enviada ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                {p.alerta_enviada ? "✓ Alerta" : "Pendiente"}
                              </span>
                              <button onClick={() => testAlerta(p.id)} className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600" title="Enviar alerta de prueba"><Send className="w-3.5 h-3.5" /></button>
                              <button onClick={() => startEdit(p)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700" title="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={() => calcularPuntos(p.id)} className="text-xs border border-blue-200 hover:bg-blue-50 px-3 py-1 rounded text-blue-600">Pts</button>
                              <button onClick={() => deletePartido(p.id)} className="text-xs border border-red-200 hover:bg-red-50 px-3 py-1 rounded text-red-500">✕</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal nuevo partido */}
        {showNew && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Nuevo partido</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Local</label>
                    <input value={newForm.equipo_local || ""} onChange={e => setNewForm(f => ({ ...f, equipo_local: e.target.value }))} className="border border-gray-300 rounded px-3 py-2 text-sm w-full" placeholder="México" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Visitante</label>
                    <input value={newForm.equipo_visitante || ""} onChange={e => setNewForm(f => ({ ...f, equipo_visitante: e.target.value }))} className="border border-gray-300 rounded px-3 py-2 text-sm w-full" placeholder="Argentina" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Fecha y hora (UTC)</label>
                  <input type="datetime-local" onChange={e => setNewForm(f => ({ ...f, fecha_utc: new Date(e.target.value).toISOString() }))} className="border border-gray-300 rounded px-3 py-2 text-sm w-full" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Fase</label>
                    <select value={newForm.fase || "Grupos"} onChange={e => setNewForm(f => ({ ...f, fase: e.target.value }))} className="border border-gray-300 rounded px-3 py-2 text-sm w-full">
                      {FASES.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Grupo</label>
                    <input value={newForm.grupo || ""} onChange={e => setNewForm(f => ({ ...f, grupo: e.target.value }))} className="border border-gray-300 rounded px-3 py-2 text-sm w-full" placeholder="A" maxLength={1} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Jornada</label>
                    <input type="number" min={1} value={newForm.jornada ?? ""} onChange={e => setNewForm(f => ({ ...f, jornada: parseInt(e.target.value) || null }))} className="border border-gray-300 rounded px-3 py-2 text-sm w-full" placeholder="1" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Ciudad</label>
                  <input value={newForm.ciudad || ""} onChange={e => setNewForm(f => ({ ...f, ciudad: e.target.value }))} className="border border-gray-300 rounded px-3 py-2 text-sm w-full" placeholder="Ciudad de México" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Estadio</label>
                  <input value={newForm.estadio || ""} onChange={e => setNewForm(f => ({ ...f, estadio: e.target.value }))} className="border border-gray-300 rounded px-3 py-2 text-sm w-full" placeholder="Estadio Azteca" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={createPartido} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm font-medium">Crear</button>
                <button onClick={() => setShowNew(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded text-sm">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
