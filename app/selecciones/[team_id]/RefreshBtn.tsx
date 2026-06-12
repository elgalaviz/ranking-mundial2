"use client";

import { useState } from "react";

export default function RefreshBtn({ playerId }: { playerId: number }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState("loading");
    await fetch("/api/revalidar-jugador", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: playerId }),
    });
    setState("done");
    setTimeout(() => setState("idle"), 2000);
  };

  return (
    <button
      onClick={handleClick}
      title="Actualizar stats"
      className="absolute top-0 right-0 w-5 h-5 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] hover:bg-gray-100"
    >
      {state === "loading" ? (
        <span className="animate-spin inline-block">↻</span>
      ) : state === "done" ? (
        <span className="text-green-500">✓</span>
      ) : (
        <span className="text-gray-500">↻</span>
      )}
    </button>
  );
}
