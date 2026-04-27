"use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const WA_NUMBER = "5218112993097";

export default function FanbotLandingPage() {
  // const router = useRouter();
  // const [phone, setPhone] = useState("");
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState("");

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError("");
  //   const digits = phone.replace(/\D/g, "");
  //   if (digits.length < 10) {
  //     setError("Ingresa tu número de WhatsApp con 10 dígitos.");
  //     return;
  //   }
  //   const normalized = digits.length === 10 ? `521${digits}` : digits;
  //   setLoading(true);
  //   router.push(`/fanbot/premium?phone=${encodeURIComponent(normalized)}`);
  // };

  return (
    <main className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* NAV */}
      <nav className="bg-[#006847] shadow-md">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <Link href="/">
            <Image src="/mifanbot-h.svg" alt="MiFanBot" width={140} height={36} />
          </Link>
          <Link
            href={`https://wa.me/${WA_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm border border-white text-white px-4 py-2 rounded-full hover:bg-white hover:text-[#006847] transition-all font-medium"
          >
            Versión gratis
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-300 text-amber-700 text-xs px-3 py-1.5 rounded-full mb-6">
            <span>⭐</span>
            FanBot Premium · Mundial 2026
          </div>

          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4 text-gray-900">
            Todo el Mundial.<br />
            <span className="text-amber-500">Sin límites.</span>
          </h1>

          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            Con FanBot gratis tienes <strong className="text-gray-900">3 consultas al día</strong>. Con Premium, pregunta todo lo que quieras durante los 64 partidos del torneo. Un solo pago.
          </p>

          {/* Comparison */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-400 mb-3">GRATIS</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-green-500">✓</span> Alertas de partidos</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span> 5 consultas/día</li>
                <li className="flex gap-2"><span className="text-gray-300">✗</span> <span className="text-gray-400">Estadísticas y alineaciones</span></li>
                <li className="flex gap-2"><span className="text-gray-300">✗</span> <span className="text-gray-400">Info detallada de partidos</span></li>
              </ul>
            </div>
            <div className="border-2 border-amber-400 rounded-xl p-4 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-xs font-bold px-3 py-0.5 rounded-full">PREMIUM</div>
              <p className="text-xs font-bold text-amber-500 mb-3">$99 MXN</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2"><span className="text-amber-500">⭐</span> Alertas de partidos</li>
                <li className="flex gap-2"><span className="text-amber-500">⭐</span> Consultas ilimitadas</li>
                <li className="flex gap-2"><span className="text-amber-500">⭐</span> Estadísticas y alineaciones</li>
                <li className="flex gap-2"><span className="text-amber-500">⭐</span> Info detallada de partidos</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Próximamente */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center gap-6">
          <div className="text-5xl">⭐</div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Próximamente</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              FanBot Premium estará disponible muy pronto.<br />
              Podrás activarlo en <span className="font-semibold text-gray-700">www.mifanbot.com/premium</span>
            </p>
          </div>
          <Link
            href={`https://wa.me/${WA_NUMBER}?text=Hola%20FanBot%2C%20quiero%20mis%20alertas%20del%20Mundial%202026`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20c05c] text-black font-bold text-sm px-6 py-3 rounded-xl transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Usar FanBot gratis por WhatsApp
          </Link>
        </div>

        {/* PAGO COMENTADO — activar cuando esté listo */}
        {/*
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">⭐</div>
            <h2 className="text-xl font-black text-gray-900">Activar Premium</h2>
            <p className="text-gray-500 text-sm mt-1">Ingresa tu número de WhatsApp para continuar al pago</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Número de WhatsApp</label>
              <div className="flex gap-2">
                <div className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-500 shrink-0">🇲🇽 +52</div>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="55 1234 5678"
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
              </div>
              {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors">
              {loading ? "Redirigiendo..." : "Continuar al pago — $99 MXN"}
            </button>
            <p className="text-xs text-center text-gray-400">Pago único · Válido todo el Mundial 2026 · Sin renovación automática</p>
          </form>
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 mb-2">¿Aún no tienes FanBot?</p>
            <Link href={`https://wa.me/${WA_NUMBER}?text=Hola%20FanBot%2C%20quiero%20mis%20alertas%20del%20Mundial%202026`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#25D366] font-medium hover:underline">
              Activa FanBot gratis primero
            </Link>
          </div>
        </div>
        */}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Image src="/mifanbot-h.svg" alt="MiFanBot" width={110} height={28} />
          <div className="flex gap-6 text-xs text-gray-500">
            <Link href="/privacidad" className="hover:text-gray-900">Privacidad</Link>
            <Link href="/condiciones" className="hover:text-gray-900">Condiciones</Link>
          </div>
          <p className="text-xs text-gray-400">© 2026 Ranking Mundial 26</p>
        </div>
        <div className="max-w-6xl mx-auto mt-4 text-center">
          <p className="text-xs text-gray-400">Rene Alejandro Galaviz Badillo · Ranking Mundial 26</p>
        </div>
      </footer>
    </main>
  );
}
