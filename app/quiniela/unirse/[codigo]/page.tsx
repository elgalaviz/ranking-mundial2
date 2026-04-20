"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function UnirseLigaPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleUnirse = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/quiniela/ligas/unirse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) { router.push(`/quiniela/login?next=/quiniela/unirse/${codigo}`); return; }
        throw new Error(data.error);
      }
      setSuccess(data.liga_nombre);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { handleUnirse(); }, []);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <Link href="/"><Image src="/mifanbot-h.svg" alt="MiFanBot" width={140} height={36} className="mx-auto" /></Link>

        {loading && (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-gray-500">Uniéndote a la liga...</p>
          </div>
        )}

        {success && (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="text-4xl">🏆</div>
            <h2 className="text-xl font-bold text-gray-800">¡Ya estás dentro!</h2>
            <p className="text-gray-500 text-sm">Te uniste a <strong>{success}</strong>. Puedes ver tu posición en el ranking de la liga.</p>
            <Link href={`/quiniela/ligas/${codigo}`} className="block w-full py-3 bg-[#006847] text-white font-semibold rounded-xl">
              Ver ranking de la liga
            </Link>
            <Link href="/quiniela" className="block text-sm text-gray-500 hover:text-gray-700">
              Ir a mis pronósticos
            </Link>
          </div>
        )}

        {error && (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="text-4xl">⚠️</div>
            <p className="text-red-600 text-sm">{error}</p>
            <Link href="/quiniela" className="block w-full py-3 bg-[#006847] text-white font-semibold rounded-xl">
              Ir a mi Quiniela
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
