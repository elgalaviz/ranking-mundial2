"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const estados = [
  "interesado",
  "llamar",
  "contactado",
  "cliente",
  "perdido",
];

function getEstadoClasses(estado: string) {
  switch (estado) {
    case "interesado":
      return "bg-blue-500 text-white";
    case "llamar":
      return "bg-yellow-400 text-black";
    case "contactado":
      return "bg-fuchsia-600 text-white";
    case "cliente":
      return "bg-green-500 text-white";
    case "perdido":
      return "bg-red-500 text-white";
    default:
      return "bg-gray-400 text-white";
  }
}

export default function StatusDropdown({
  id,
  current,
}: {
  id: string;
  current: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState(current);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  const badgeClass = useMemo(() => {
    return getEstadoClasses(selected);
  }, [selected]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoEstado = e.target.value;
    const estadoAnterior = selected;

    setSelected(nuevoEstado);
    setSaved("saving");

    startTransition(async () => {
      try {
        const res = await fetch("/api/leads/update-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            estado: nuevoEstado,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setSelected(estadoAnterior);
          setSaved("error");
          alert(data.error || "No se pudo actualizar el estado");
          return;
        }

        setSaved("saved");
        router.refresh();

        setTimeout(() => {
          setSaved("idle");
        }, 1400);
      } catch (error) {
        console.error("Error actualizando estado:", error);
        setSelected(estadoAnterior);
        setSaved("error");
        alert("Error inesperado al actualizar estado");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide shadow-sm transition-all duration-200 ${badgeClass}`}
      >
        {selected}
      </span>

      <select
        value={selected}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#9c4f93] disabled:opacity-60"
      >
        {estados.map((estado) => (
          <option key={estado} value={estado}>
            {estado}
          </option>
        ))}
      </select>

      <span className="min-w-[68px] text-xs font-semibold">
        {saved === "saving" && (
          <span className="animate-pulse text-[#9c4f93]">Guardando...</span>
        )}
        {saved === "saved" && <span className="text-green-600">Guardado</span>}
        {saved === "error" && <span className="text-red-500">Error</span>}
      </span>
    </div>
  );
}