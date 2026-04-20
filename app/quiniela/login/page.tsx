"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function QuinielaLoginPage() {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [fullPhone, setFullPhone] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const completePhone = `52${phone}`;

    try {
      const res = await fetch("/api/auth/enviar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: completePhone }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Ocurrió un error.");

      setFullPhone(completePhone);
      setStep("code");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verificar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, code }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Ocurrió un error.");

      router.push("/quiniela");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-black text-[#006847]">
              RANKING <span className="text-[#CE1126]">MUNDIAL</span> 26
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-4">Inicia Sesión en la Quiniela</h1>
          <p className="text-gray-500 mt-2">
            {step === "phone"
              ? "Ingresa tu número de WhatsApp para recibir un código de acceso."
              : `Te enviamos un código a +${fullPhone}. Ingrésalo abajo.`}
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-200">
          {step === "phone" ? (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Tu número de WhatsApp
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    +52
                  </span>
                  <input
                    type="tel"
                    id="phone"
                    className="block w-full flex-1 rounded-none rounded-r-md border border-gray-300 px-3 py-2 focus:border-[#006847] focus:outline-none focus:ring-1 focus:ring-[#006847] sm:text-sm"
                    placeholder="81 1234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    required
                    disabled={isLoading}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Debes estar registrado en el bot primero.</p>
              </div>

              <button
                type="submit"
                disabled={isLoading || phone.length < 10}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#006847] hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Enviando..." : "Enviar Código"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Código de 6 dígitos
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="code"
                    maxLength={6}
                    className="block w-full text-center tracking-[1em] font-mono text-xl border border-gray-300 rounded-md px-3 py-3 shadow-sm focus:border-[#006847] focus:outline-none focus:ring-1 focus:ring-[#006847]"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    required
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || code.length < 6}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#006847] hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Verificando..." : "Verificar e Ingresar"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("phone"); setError(""); setCode(""); }}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-700 transition-colors"
                disabled={isLoading}
              >
                ¿Número incorrecto? Volver
              </button>
            </form>
          )}

          {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </main>
  );
}
