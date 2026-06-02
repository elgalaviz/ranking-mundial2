"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export default function PlanToggle({ userId, currentPlan }: { userId: string; currentPlan: string | null }) {
  const isPremium = currentPlan === "premium";
  const [plan, setPlan] = useState(isPremium);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const newPlan = plan ? "free" : "premium";
    const res = await fetch(`/api/admin/users/${userId}/plan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: newPlan }),
    });
    if (res.ok) setPlan(!plan);
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
        plan
          ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      <Star className={`w-4 h-4 ${plan ? "fill-amber-500 text-amber-500" : "text-gray-400"}`} />
      {loading ? "..." : plan ? "PRO — quitar" : "Dar PRO"}
    </button>
  );
}
