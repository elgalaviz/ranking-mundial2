"use client";

import { useState } from "react";
import { RefreshCw, Star } from "lucide-react";

type SyncResult = { ok: boolean; selecciones?: number; jugadores?: number; marcados?: number; errores?: string[]; error?: string };

export default function SyncButtons() {
  const [syncState, setSyncState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [destacadosState, setDestacadosState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [destacadosResult, setDestacadosResult] = useState<SyncResult | null>(null);

  async function runSync() {
    setSyncState("loading");
    setSyncResult(null);
    try {
      const res = await fetch("/api/admin/sync-jugadores");
      const data: SyncResult = await res.json();
      setSyncResult(data);
      setSyncState(data.ok ? "done" : "error");
      if (data.ok) setTimeout(() => window.location.reload(), 1000);
    } catch {
      setSyncState("error");
    }
  }

  async function runDestacados() {
    setDestacadosState("loading");
    setDestacadosResult(null);
    try {
      const res = await fetch("/api/admin/sync-destacados");
      const data: SyncResult = await res.json();
      setDestacadosResult(data);
      setDestacadosState(data.ok ? "done" : "error");
    } catch {
      setDestacadosState("error");
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex flex-col gap-1">
        <button
          onClick={runSync}
          disabled={syncState === "loading"}
          className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg font-medium transition-colors ${
            syncState === "done" ? "bg-green-600 text-white" :
            syncState === "error" ? "bg-red-500 text-white" :
            "bg-gray-900 text-white hover:bg-gray-700"
          } disabled:opacity-50`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncState === "loading" ? "animate-spin" : ""}`} />
          {syncState === "loading" ? "Sincronizando..." : syncState === "done" ? "✓ Sync completo" : syncState === "error" ? "Error" : "Re-sync jugadores"}
        </button>
        {syncResult?.ok && (
          <p className="text-[10px] text-gray-500">{syncResult.selecciones} equipos · {syncResult.jugadores} jugadores</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <button
          onClick={runDestacados}
          disabled={destacadosState === "loading"}
          className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg font-medium transition-colors ${
            destacadosState === "done" ? "bg-green-600 text-white" :
            destacadosState === "error" ? "bg-red-500 text-white" :
            "bg-amber-500 text-white hover:bg-amber-600"
          } disabled:opacity-50`}
        >
          <Star className="w-3.5 h-3.5" />
          {destacadosState === "loading" ? "Marcando..." : destacadosState === "done" ? "✓ Destacados OK" : destacadosState === "error" ? "Error" : "Re-sync destacados"}
        </button>
        {destacadosResult?.ok && (
          <p className="text-[10px] text-gray-500">{destacadosResult.marcados} marcados · {destacadosResult.errores?.length || 0} no encontrados</p>
        )}
      </div>
    </div>
  );
}
