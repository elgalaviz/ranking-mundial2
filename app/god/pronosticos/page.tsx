"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type UserSummary = {
  whatsapp_id: string;
  total: number;
  acertados: number;
  pendientes: number;
  user: { id: string; name: string | null; phone: string | null } | null;
};

type Pronostico = {
  id: string;
  equipo_local: string;
  equipo_visitante: string;
  pronostico: "local" | "empate" | "visitante";
  momio: number;
  fecha_partido: string | null;
  acerto: boolean | null;
  notificado: boolean;
};

const LABELS: Record<string, string> = { local: "🏠 Local", empate: "🤝 Empate", visitante: "✈️ Visitante" };

function estadoBadge(acerto: boolean | null) {
  if (acerto === null) return <span className="text-xs bg-yellow-100 text-yellow-700 font-medium px-2 py-0.5 rounded-full">⏳ Pendiente</span>;
  if (acerto) return <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">✅ Acertó</span>;
  return <span className="text-xs bg-red-100 text-red-700 font-medium px-2 py-0.5 rounded-full">❌ Falló</span>;
}

function formatFecha(f: string | null) {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Mexico_City" });
}

function UserRow({ u }: { u: UserSummary }) {
  const [open, setOpen] = useState(false);
  const [pronos, setPronos] = useState<Pronostico[]>([]);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!open && pronos.length === 0) {
      setLoading(true);
      const res = await fetch(`/api/admin/pronosticos?whatsapp_id=${encodeURIComponent(u.whatsapp_id)}`);
      const data = await res.json();
      setPronos(Array.isArray(data) ? data : []);
      setLoading(false);
    }
    setOpen((v) => !v);
  }

  const resueltos = u.total - u.pendientes;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={toggle}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 text-sm">{u.user?.name ?? "Fan"}</p>
          <p className="text-xs text-gray-400 font-mono">{u.user?.phone ?? u.whatsapp_id}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-800">{u.total} pronósticos</p>
            <p className="text-xs text-gray-400">
              {resueltos > 0 ? `${u.acertados}/${resueltos} aciertos` : "Sin resolver"}
              {u.pendientes > 0 ? ` · ${u.pendientes} pendientes` : ""}
            </p>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {loading ? (
            <div className="p-6 text-center text-gray-400 text-sm">Cargando...</div>
          ) : pronos.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">Sin pronósticos</div>
          ) : pronos.map((p) => {
            const elegido = p.pronostico === "local" ? p.equipo_local : p.pronostico === "visitante" ? p.equipo_visitante : "Empate";
            return (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 font-medium truncate">
                    {p.equipo_local} vs {p.equipo_visitante}
                  </p>
                  <p className="text-xs text-gray-500">
                    {LABELS[p.pronostico]} · <strong>{elegido}</strong> · {p.momio}x · {formatFecha(p.fecha_partido)}
                  </p>
                </div>
                <div className="shrink-0">{estadoBadge(p.acerto)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function GodPronosticosPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/pronosticos")
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (u.user?.name ?? "").toLowerCase().includes(q) ||
      (u.user?.phone ?? "").includes(q) ||
      u.whatsapp_id.includes(q)
    );
  });

  const totalPronos = users.reduce((s, u) => s + u.total, 0);
  const totalAciertos = users.reduce((s, u) => s + u.acertados, 0);
  const totalResueltos = users.reduce((s, u) => s + (u.total - u.pendientes), 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Pronósticos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {users.length} usuarios · {totalPronos} pronósticos totales
            {totalResueltos > 0 && ` · ${totalAciertos}/${totalResueltos} aciertos globales`}
          </p>
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-300 w-64"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#006847] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
          {search ? "Sin resultados para esa búsqueda." : "Aún no hay pronósticos registrados."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => <UserRow key={u.whatsapp_id} u={u} />)}
        </div>
      )}
    </div>
  );
}
