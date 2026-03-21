"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type SellerOption = {
  user_id: string;
  role: string | null;
  email: string;
};

export default function AssignLeadDropdown({
  leadId,
  currentAssignedUserId,
  sellerOptions,
}: {
  leadId: string;
  currentAssignedUserId?: string | null;
  sellerOptions: SellerOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState(currentAssignedUserId || "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    const previousValue = selected;

    setSelected(newValue);
    setStatus("saving");

    startTransition(async () => {
      try {
        const res = await fetch("/api/leads/assign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            leadId,
            assignedUserId: newValue || null,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setSelected(previousValue);
          setStatus("error");
          alert(data.error || "No se pudo asignar el lead");
          return;
        }

        setStatus("saved");
        router.refresh();

        setTimeout(() => {
          setStatus("idle");
        }, 1400);
      } catch (error) {
        console.error("Error asignando lead:", error);
        setSelected(previousValue);
        setStatus("error");
        alert("Error inesperado al asignar lead");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#9c4f93] disabled:opacity-60"
      >
        <option value="">Sin asignar</option>
        {sellerOptions.map((seller) => (
  <option key={seller.user_id} value={seller.user_id}>
    {seller.email}
  </option>
))}
      </select>

      <span className="min-w-[68px] text-xs font-semibold">
        {status === "saving" && (
          <span className="animate-pulse text-[#9c4f93]">Guardando...</span>
        )}
        {status === "saved" && <span className="text-green-600">Guardado</span>}
        {status === "error" && <span className="text-red-500">Error</span>}
      </span>
    </div>
  );
}