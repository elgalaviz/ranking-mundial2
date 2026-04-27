"use client";

import Image from "next/image";
import Link from "next/link";

const WA_NUMBER = "5218112993097";

export default function PremiumPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/">
            <Image src="/mifanbot-h.svg" alt="MiFanBot" width={140} height={36} className="mx-auto" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-linear-to-br from-amber-400 to-orange-500 p-6 text-center text-white">
            <div className="text-5xl mb-2">⭐</div>
            <h1 className="text-2xl font-black">FanBot Premium</h1>
            <p className="text-amber-100 text-sm mt-1">Pase completo Mundial 2026</p>
          </div>

          <div className="p-8 flex flex-col items-center text-center gap-5">
            <div>
              <p className="text-lg font-black text-gray-900 mb-1">Próximamente</p>
              <p className="text-gray-500 text-sm leading-relaxed">
                FanBot Premium estará disponible muy pronto en<br />
                <span className="font-semibold text-gray-700">www.mifanbot.com/premium</span>
              </p>
            </div>

            <ul className="space-y-2 text-left w-full">
              {[
                "Consultas ilimitadas durante todo el torneo",
                "Estadísticas y datos en tiempo real",
                "Predicciones y análisis avanzados",
                "Acceso prioritario durante partidos",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="text-amber-400 font-bold mt-0.5">⭐</span>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href={`https://wa.me/${WA_NUMBER}?text=Hola%20FanBot%2C%20quiero%20mis%20alertas%20del%20Mundial%202026`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-[#25D366] hover:bg-[#20c05c] text-black font-bold rounded-xl transition-colors text-center text-sm"
            >
              Usar FanBot gratis por WhatsApp
            </Link>
          </div>
        </div>
      </div>

      {/* PAGO COMENTADO — activar cuando esté listo */}
      {/*
      <PremiumPago />

      function PremiumPago() {
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
          <div className="p-6 space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">Hubo un problema con tu pago. Intenta de nuevo.</div>}
            <div className="border-t border-gray-100 pt-4 text-center">
              <p className="text-3xl font-black text-gray-900">$99 <span className="text-base font-normal text-gray-400">MXN</span></p>
              <p className="text-xs text-gray-400 mt-0.5">Pago único · Sin renovación</p>
            </div>
            <button onClick={handlePagar} disabled={loading || !phone}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors">
              {loading ? "Redirigiendo..." : "Pagar $99 MXN"}
            </button>
            {!phone && <p className="text-xs text-center text-red-500">Accede desde el link que te envió FanBot por WhatsApp.</p>}
          </div>
        );
      }
      */}
    </main>
  );
}
