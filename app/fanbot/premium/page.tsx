"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";

function PremiumContent() {
  const params = useSearchParams();
  const router = useRouter();
  const phone = params.get("phone") ?? "";
  const error = params.get("error");
  const [loading, setLoading] = useState(false);

  const handlePagar = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fanbot/premium/pagar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const { checkout_url, error: err } = await res.json();
      if (err || !checkout_url) throw new Error(err ?? "Error");
      router.push(checkout_url);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <Link href="/">
          <Image src="/mifanbot-h.svg" alt="MiFanBot" width={140} height={36} className="mx-auto" />
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 text-center text-white">
          <div className="text-5xl mb-2">⭐</div>
          <h1 className="text-2xl font-black">FanBot Premium</h1>
          <p className="text-amber-100 text-sm mt-1">Pase completo Mundial 2026</p>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              Hubo un problema con tu pago. Intenta de nuevo.
            </div>
          )}

          <ul className="space-y-3">
            {[
              "Consultas ilimitadas durante todo el torneo",
              "Estadísticas y datos en tiempo real",
              "Predicciones y análisis avanzados",
              "Acceso prioritario durante partidos",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="text-green-500 font-bold mt-0.5">✓</span>
                {f}
              </li>
            ))}
          </ul>

          <div className="border-t border-gray-100 pt-4 text-center">
            <p className="text-3xl font-black text-gray-900">$99 <span className="text-base font-normal text-gray-400">MXN</span></p>
            <p className="text-xs text-gray-400 mt-0.5">Pago único · Sin renovación</p>
          </div>

          <button
            onClick={handlePagar}
            disabled={loading || !phone}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
          >
            {loading ? "Redirigiendo..." : "Pagar $99 MXN"}
          </button>

          {!phone && (
            <p className="text-xs text-center text-red-500">
              Accede a esta página desde el link que te envió FanBot por WhatsApp.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PremiumPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense>
        <PremiumContent />
      </Suspense>
    </main>
  );
}
