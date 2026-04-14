"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Ocurrió un error inesperado al iniciar sesión.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] px-6">
      <div className="w-full max-w-md rounded-4xl border border-white/30 bg-white/90 p-8 shadow-[0_25px_70px_rgba(51,32,77,0.28)] backdrop-blur">
        
        {/* ✅ Logo agregado */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-2xl bg-white p-3 shadow-lg ring-1 ring-black/5">
            <Image
              src="/Prospekt-app.png"
              alt="Prospekto"
              width={64}
              height={64}
              priority
              className="h-16 w-16 object-contain"
            />
          </div>
        </div>

        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7d679f]">
            Sistema
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Prospekto
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Accede a tu panel para revisar leads, conversaciones y seguimiento comercial.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Correo
            </label>
            <input
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#b57ab0] focus:ring-4 focus:ring-[#eed4e6]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#b57ab0] focus:ring-4 focus:ring-[#eed4e6]"
            />
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] text-sm font-semibold text-white shadow-[0_12px_24px_rgba(200,79,146,0.28)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}