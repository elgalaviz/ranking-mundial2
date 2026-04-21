"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";

function ExitoContent() {
  const params = useSearchParams();
  const pendiente = params.get("pendiente");

  return (
    <div className="w-full max-w-sm text-center space-y-6">
      <Link href="/">
        <Image src="/mifanbot-h.svg" alt="MiFanBot" width={140} height={36} className="mx-auto" />
      </Link>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        {pendiente ? (
          <>
            <div className="text-4xl">⏳</div>
            <h2 className="text-xl font-bold text-gray-800">Pago en proceso</h2>
            <p className="text-gray-500 text-sm">
              Tu pago está siendo procesado. En cuanto se confirme te avisamos por WhatsApp y tu cuenta quedará Premium.
            </p>
          </>
        ) : (
          <>
            <div className="text-4xl">⭐</div>
            <h2 className="text-xl font-bold text-gray-800">¡Ya eres Premium!</h2>
            <p className="text-gray-500 text-sm">
              Recibirás un mensaje de confirmación por WhatsApp. Ya puedes hacer consultas ilimitadas durante todo el Mundial 2026.
            </p>
          </>
        )}

        <Link
          href="/"
          className="block w-full py-3 bg-amber-500 text-white font-semibold rounded-xl text-center"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}

export default function PremiumExitoPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense>
        <ExitoContent />
      </Suspense>
    </main>
  );
}
