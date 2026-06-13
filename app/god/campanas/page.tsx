"use client";

import { useEffect, useState } from "react";
import { Megaphone, Send, Users } from "lucide-react";

const SECRET = "mundial26-cron-2026";
const DEFAULT_MSG = `⚽ ¡Hola! Soy FanBot, tu asistente del Mundial 2026.

Notamos que aún no tienes activadas las alertas de partidos. ¡No te pierdas ni un gol!

Responde *SÍ* para recibir alertas 15 minutos antes de cada partido, o *NO* si prefieres no recibirlas.`;

type Usuario = { id: string; phone: string; name: string | null };

export default function CampanasPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(DEFAULT_MSG);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ enviadas: number; fallidas: number } | null>(null);

  useEffect(() => {
    fetch("/api/admin/campaign-activar-alertas", {
      headers: { "x-cron-secret": SECRET },
    })
      .then(r => r.json())
      .then(d => { setUsuarios(d.usuarios || []); setLoading(false); });
  }, []);

  const handleEnviar = async () => {
    if (!confirm(`¿Enviar a ${usuarios.length} usuarios?`)) return;
    setEnviando(true);
    setResultado(null);
    const res = await fetch("/api/admin/campaign-activar-alertas", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-cron-secret": SECRET },
      body: JSON.stringify({ mensaje }),
    });
    const data = await res.json();
    setResultado({ enviadas: data.enviadas, fallidas: data.fallidas });
    setEnviando(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Megaphone className="w-6 h-6" /> Campañas
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Envía mensajes a usuarios que aún no han respondido si quieren alertas.
        </p>
      </div>

      {/* Audiencia */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-800">
            Audiencia — sin respuesta ({loading ? "…" : usuarios.length} usuarios)
          </h2>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Cargando…</p>
        ) : usuarios.length === 0 ? (
          <p className="text-sm text-gray-400">Todos los usuarios ya respondieron. 🎉</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {usuarios.map(u => (
              <span key={u.id} className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700 font-mono">
                {u.name ? `${u.name} ` : ""} +{u.phone}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Mensaje */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-gray-800">Mensaje</h2>
        <textarea
          value={mensaje}
          onChange={e => setMensaje(e.target.value)}
          rows={8}
          className="w-full border border-gray-200 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
        />
        <p className="text-xs text-amber-600">
          ⚠️ Solo llega a usuarios que hayan chateado con el bot en las últimas 24h. Para otros necesitas un template aprobado en Meta.
        </p>
      </div>

      {/* Botón enviar */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleEnviar}
          disabled={enviando || usuarios.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          {enviando ? "Enviando…" : `Enviar a ${usuarios.length} usuarios`}
        </button>

        {resultado && (
          <div className="text-sm">
            <span className="text-green-600 font-semibold">{resultado.enviadas} enviados</span>
            {resultado.fallidas > 0 && (
              <span className="text-red-500 ml-3">{resultado.fallidas} fallidos</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
