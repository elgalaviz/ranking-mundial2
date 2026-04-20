"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";

function PagoContent() {
  const params = useSearchParams();
  const pendiente = params.get("pendiente");
  const gratis = params.get("gratis");

  return (
    <div className="w-full max-w-sm text-center space-y-6">
      <Link href="/">
        <Image src="/mifanbot-h.svg" alt="MiFanBot" width={140} height={36} className="mx-auto" />
      </Link>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        {gratis ? (
          <>
            <div className="text-4xl">🏆</div>
            <h2 className="text-xl font-bold text-gray-800">¡Liga creada!</h2>
            <p className="text-gray-500 text-sm">
              Tu liga está activa. En unos segundos recibirás el código de invitación por WhatsApp.
            </p>
          </>
        ) : pendiente ? (
          <>
            <div className="text-4xl">⏳</div>
            <h2 className="text-xl font-bold text-gray-800">Pago en proceso</h2>
            <p className="text-gray-500 text-sm">
              Tu pago está siendo procesado. En cuanto se confirme recibirás el código de tu liga por WhatsApp.
            </p>
          </>
        ) : (
          <>
            <div className="text-4xl">🎉</div>
            <h2 className="text-xl font-bold text-gray-800">¡Pago exitoso!</h2>
            <p className="text-gray-500 text-sm">
              Tu liga está activa. En unos segundos recibirás el código de invitación por WhatsApp.
            </p>
          </>
        )}

        <Link
          href="/quiniela"
          className="block w-full py-3 bg-[#006847] text-white font-semibold rounded-xl text-center"
        >
          Ir a mi Quiniela
        </Link>
      </div>
    </div>
  );
}

export default function PagoExitosoPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense>
        <PagoContent />
      </Suspense>
    </main>
  );
}
