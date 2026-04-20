"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function NuevaLigaPage() {
  const [form, setForm] = useState({ nombre: "", tier: 0, owner_nombre: "", owner_phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/quiniela/ligas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const ligaId = data.liga?.id;
      if (!ligaId) throw new Error("No se pudo crear la liga.");

      if (form.tier === 0) {
        window.location.href = `/quiniela/ligas/pago-exitoso?liga=${ligaId}&gratis=1`;
        return;
      }

      const pagarRes = await fetch("/api/quiniela/ligas/pagar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liga_id: ligaId }),
      });
      const pagarData = await pagarRes.json();
      if (!pagarRes.ok) throw new Error(pagarData.error);

      window.location.href = pagarData.checkout_url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/"><Image src="/mifanbot-h.svg" alt="MiFanBot" width={140} height={36} className="mx-auto" /></Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-4">Crea tu Liga Privada</h1>
          <p className="text-gray-500 text-sm mt-1">Quiniela Mundial 2026 con tus amigos</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de tu liga</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Quiniela Familia García"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-[#006847] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { tier: 0, label: "Gratis", desc: "Hasta 10 personas" },
                    { tier: 150, label: "$150 MXN", desc: "Hasta 50 personas" },
                  ].map(opt => (
                    <button
                      key={opt.tier}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, tier: opt.tier }))}
                      className={`p-4 rounded-xl border-2 text-left transition-colors ${
                        form.tier === opt.tier
                          ? "border-[#006847] bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="font-bold text-gray-800">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tu nombre</label>
                <input
                  type="text"
                  required
                  placeholder="Nombre completo"
                  value={form.owner_nombre}
                  onChange={e => setForm(f => ({ ...f, owner_nombre: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-[#006847] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tu WhatsApp</label>
                <div className="flex rounded-xl shadow-sm border border-gray-300 overflow-hidden focus-within:border-[#006847]">
                  <span className="inline-flex items-center px-3 bg-gray-50 text-gray-500 text-sm border-r border-gray-300">+52</span>
                  <input
                    type="tel"
                    required
                    placeholder="81 1234 5678"
                    value={form.owner_phone.replace(/^521?/, "")}
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setForm(f => ({ ...f, owner_phone: digits ? `52${digits}` : "" }));
                    }}
                    className="flex-1 px-4 py-2.5 text-sm focus:outline-none"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#006847] hover:bg-green-800 text-white font-semibold rounded-xl transition-colors disabled:bg-gray-400"
              >
                {loading ? "Creando..." : form.tier === 0 ? "Crear liga gratis →" : "Continuar al pago →"}
              </button>
            </form>
          </div>

      </div>
    </main>
  );
}
