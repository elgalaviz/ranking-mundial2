"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export default function BulkProButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleClick() {
    if (!confirm("¿Hacer PRO a TODOS los usuarios?")) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/users/bulk-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "premium" }),
      });
      const json = await res.json();
      if (json.ok) {
        setResult(`${json.updated} usuarios ahora son PRO`);
      } else {
        setResult(`Error: ${json.error}`);
      }
    } catch {
      setResult("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className="text-sm text-amber-700 font-medium">{result}</span>
      )}
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-black font-bold text-sm px-4 py-2 rounded-xl transition-colors"
      >
        <Star className="w-4 h-4 fill-current" />
        {loading ? "Actualizando…" : "Todos a PRO"}
      </button>
    </div>
  );
}
