"use client";

import { useState } from "react";
import { Zap } from "lucide-react";

export default function TriviaTemplateButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  async function handleSend() {
    if (!confirm("¿Enviar trivia de El Tri a todos los usuarios con alertas activas?")) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/send-trivia-template", { method: "POST" });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult(null);
      alert("Error al enviar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 flex items-center gap-3">
      <button
        onClick={handleSend}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        <Zap className="w-4 h-4" />
        {loading ? "Enviando..." : "Enviar trivia a fans"}
      </button>
      {result && (
        <span className="text-sm text-gray-600">
          ✅ {result.sent} enviados
          {result.failed > 0 && <span className="text-red-500 ml-2">❌ {result.failed} fallidos</span>}
          {" "}de {result.total} con alertas
        </span>
      )}
    </div>
  );
}
