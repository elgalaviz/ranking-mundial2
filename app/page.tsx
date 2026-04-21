import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const WA_NUMBER = "5218112993097";

async function getProximosPartidos() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("partidos")
      .select("*")
      .gte("fecha_utc", new Date().toISOString())
      .order("fecha_utc", { ascending: true })
      .limit(5);
    return data || [];
  } catch {
    return [];
  }
}

function formatFecha(utc: string) {
  return new Date(utc).toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function LandingPage() {
  const partidos = await getProximosPartidos();

  return (
    <main className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ── NAV ───────────────────────────────────────── */}
      <nav className="bg-[#006847] shadow-md">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <a href="/">
            <img src="/mifanbot-h.svg" alt="MiFanBot" width={140} height={36} />
          </a>
          <a
            href={`https://wa.me/${WA_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm border border-white text-white px-4 py-2 rounded-full hover:bg-white hover:text-[#006847] transition-all font-medium"
          >
            Unirme gratis
          </a>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-10 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#006847]/10 border border-[#006847]/50 text-[#006847] text-xs px-3 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-[#006847] rounded-full animate-pulse" />
            Mundial 2026 · 11 Jun – 19 Jul · USA · CAN · MEX
          </div>

          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4 text-gray-900">
            Tu guía del{" "}
            <span className="text-[#006847]">Mundial 2026</span>
            <br />por WhatsApp
          </h1>

          <p className="text-gray-700 text-lg mb-8 leading-relaxed">
            Recibe alertas <strong className="text-gray-900">15 minutos antes</strong> de cada partido,
            info de los jugadores a seguir y respuestas a todo lo que quieras saber del mundial.
            Gratis. Sin app. Solo WhatsApp.
          </p>

          <a
            href={`https://wa.me/${WA_NUMBER}?text=Hola%20FanBot%2C%20quiero%20mis%20alertas%20del%20Mundial%202026`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20c05c] text-black font-bold text-lg px-8 py-4 rounded-2xl transition-all shadow-lg shadow-[#25D366]/20 mb-4"
          >
            <WhatsAppIcon />
            Activar mis alertas gratis
          </a>

          <p className="text-gray-500 text-sm">Sin registros. Sin contraseña. Solo escríbenos.</p>

          <a
            href="/api/calendario"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#006847] mt-3 transition-colors"
          >
            📅 Descargar todos los partidos para Google Calendar / iPhone
          </a>

          {/* Stats */}
          <div className="flex gap-8 mt-10">
            {[
              { n: "104", label: "Partidos" },
              { n: "48", label: "Selecciones" },
              { n: "16", label: "Ciudades sede" },
            ].map(s => (
              <div key={s.label}>
                <div className="text-2xl font-black text-[#006847]">{s.n}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Phone mockup */}
        <div className="flex justify-center lg:justify-end">
          <PhoneMockup />
        </div>
      </section>

      {/* ── PRÓXIMOS PARTIDOS ─────────────────────────── */}
      {partidos.length > 0 && (
        <section className="bg-gray-50 py-16 border-y border-gray-100">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Próximos partidos</h2>
            <p className="text-gray-500 text-sm mb-8">Horarios en tiempo de Ciudad de México</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {partidos.map((p: Record<string, string>) => (
                <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-[#006847]/40 hover:shadow-md transition-all">
                  <div className="text-xs text-[#006847] mb-2 font-semibold">
                    {p.fase}{p.grupo ? ` · Grupo ${p.grupo}` : ""}
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-gray-900">{p.equipo_local}</span>
                    <span className="text-gray-400 text-sm font-medium px-2">vs</span>
                    <span className="font-bold text-gray-900 text-right">{p.equipo_visitante}</span>
                  </div>
                  <div className="text-xs text-gray-500">{formatFecha(p.fecha_utc)}</div>
                  {p.estadio && <div className="text-xs text-gray-400 mt-1">{p.estadio} · {p.ciudad}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CÓMO FUNCIONA ─────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">Así de fácil</h2>
        <p className="text-gray-500 text-center text-sm mb-12">Sin apps, sin registros, sin complicaciones</p>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            { n: "1", icon: "💬", title: "Escríbenos", desc: "Manda un mensaje al número de FanBot. En segundos quedas registrado." },
            { n: "2", icon: "⚽", title: "Recibe alertas", desc: "15 minutos antes de cada partido te mandamos info del juego y jugadores a seguir." },
            { n: "3", icon: "🤖", title: "Pregunta lo que quieras", desc: "Nuestro chatbot responde todo sobre el Mundial 2026 y la historia del fútbol." },
          ].map(s => (
            <div key={s.n} className="text-center">
              <div className="w-14 h-14 bg-[#006847]/10 border border-[#006847]/30 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
                {s.icon}
              </div>
              <div className="text-xs text-[#006847] font-bold mb-2">PASO {s.n}</div>
              <h3 className="font-bold text-lg mb-2 text-gray-900">{s.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── QUINIELA ──────────────────────────────────── */}
      <section className="bg-gray-50 py-20 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6">

          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#006847]/10 border border-[#006847]/30 text-[#006847] text-xs px-3 py-1.5 rounded-full mb-4">
              <span className="w-2 h-2 bg-[#006847] rounded-full animate-pulse" />
              Ya disponible
            </div>
            <h2 className="text-3xl font-black text-gray-900">Quiniela Mundial 2026</h2>
            <p className="text-gray-500 mt-2 text-sm">Predice resultados, gana puntos y compite con todos</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">

            {/* Quiniela pública */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <div className="text-4xl mb-4">🏆</div>
              <div className="inline-block bg-[#006847]/10 text-[#006847] text-xs font-bold px-2 py-1 rounded-full mb-3">GRATIS</div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Quiniela Global</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Ingresa con tu número de WhatsApp, predice los marcadores de cada partido y compite contra todos los participantes en el ranking general.
              </p>
              <ul className="space-y-2 mb-8">
                {[
                  "6 pts por marcador exacto",
                  "3 pts por resultado correcto",
                  "Ranking en tiempo real",
                  "Notificaciones por WhatsApp",
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-[#006847] font-bold">✓</span> {item}
                  </li>
                ))}
              </ul>
              <a
                href="/quiniela"
                className="block w-full py-3 bg-[#006847] hover:bg-green-800 text-white font-bold text-center rounded-xl transition-colors"
              >
                Entrar a la Quiniela →
              </a>
            </div>

            {/* Ligas privadas */}
            <div className="bg-white border-2 border-[#006847] rounded-2xl p-8 shadow-md relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-[#006847] text-white text-xs font-bold px-3 py-1 rounded-full">NUEVO</div>
              <div className="text-4xl mb-4">⚽</div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Liga Privada</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Crea tu propia quiniela con familia o amigos. Código exclusivo, ranking privado y resultados por WhatsApp después de cada partido.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { price: "Gratis", limit: "Hasta 10 personas", tag: "Grupos chicos" },
                  { price: "$150 MXN", limit: "Hasta 50 personas", tag: "Grupos grandes" },
                ].map(plan => (
                  <div key={plan.price} className="border border-gray-200 rounded-xl p-4 text-center">
                    <div className="text-xs text-gray-400 mb-1">{plan.tag}</div>
                    <div className="text-lg font-black text-gray-900">{plan.price}</div>
                    <div className="text-xs text-gray-500 mt-1">{plan.limit}</div>
                  </div>
                ))}
              </div>

              <a
                href="/quiniela/ligas/nueva"
                className="block w-full py-3 bg-[#006847] hover:bg-green-800 text-white font-bold text-center rounded-xl transition-colors"
              >
                Crear mi Liga Privada →
              </a>
              <p className="text-center text-xs text-gray-400 mt-3">Pago único · Válido todo el Mundial</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FANBOT PREMIUM ────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-300 text-amber-700 text-xs px-3 py-1.5 rounded-full mb-4">
              <span className="text-base">⭐</span>
              FanBot Premium
            </div>
            <h2 className="text-3xl font-black text-gray-900">Consultas ilimitadas todo el torneo</h2>
            <p className="text-gray-500 mt-2 text-sm">Un solo pago. Sin límites. Durante todo el Mundial 2026.</p>
          </div>

          <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
            {/* Features */}
            <div className="space-y-4">
              {[
                { icon: "💬", title: "Consultas ilimitadas", desc: "Pregunta todo lo que quieras sin restricciones durante los 64 partidos del torneo." },
                { icon: "📊", title: "Estadísticas y datos en tiempo real", desc: "Historial de enfrentamientos, jugadores clave, análisis tácticos y más." },
                { icon: "🤖", title: "Predicciones avanzadas", desc: "Análisis con IA de cada partido antes de que empiece." },
                { icon: "⚡", title: "Acceso prioritario en partidos", desc: "Respuestas inmediatas durante los momentos más intensos del juego." },
              ].map(f => (
                <div key={f.title} className="flex gap-4">
                  <div className="w-10 h-10 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center text-xl shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{f.title}</h3>
                    <p className="text-gray-500 text-xs leading-relaxed mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing card */}
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-8 text-white text-center shadow-xl shadow-amber-200">
              <div className="text-5xl mb-4">⭐</div>
              <div className="text-5xl font-black mb-1">$99</div>
              <div className="text-amber-100 text-sm mb-6">MXN · Pago único · Sin renovación</div>
              <a
                href="/fanbot"
                className="block w-full py-3.5 bg-white text-amber-600 font-bold rounded-xl hover:bg-amber-50 transition-colors"
              >
                Obtener Premium →
              </a>
              <p className="text-amber-100 text-xs mt-4">Gratis: 3 consultas al día · Premium: ilimitadas</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────── */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <div className="text-5xl mb-6">🏆</div>
          <h2 className="text-3xl font-black mb-4 text-gray-900">
            El Mundial arranca el <span className="text-[#006847]">11 de junio</span>
          </h2>
          <p className="text-gray-600 mb-8">
            Más de 100 partidos. 48 selecciones. Sé el primero en saberlo todo.
          </p>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=Hola%20FanBot%2C%20quiero%20mis%20alertas%20del%20Mundial%202026`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20c05c] text-black font-bold text-lg px-8 py-4 rounded-2xl transition-all"
          >
            <WhatsAppIcon />
            Activar alertas gratis
          </a>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo small />
          <div className="flex gap-6 text-xs text-gray-500">
            <a href="/privacidad" className="hover:text-gray-900">Privacidad</a>
            <a href="/condiciones" className="hover:text-gray-900">Condiciones</a>
            <a href="/eliminacion-datos" className="hover:text-gray-900">Eliminar datos</a>
          </div>
          <p className="text-xs text-gray-400">© 2026 Ranking Mundial 26</p>
        </div>
      </footer>
    </main>
  );
}

function Logo({ small }: { small?: boolean }) {
  return (
    <div className={`flex items-center gap-1 ${small ? "scale-75 origin-left" : ""}`}>
      <div className="flex flex-col gap-0.5 mr-1">
        {[12, 10, 8, 6, 4].map((w, i) => (
          <div key={i} style={{ width: w }} className="h-0.5 bg-[#00e5a0] rounded-full" />
        ))}
      </div>
      <div>
        <div className="text-[10px] font-black text-white tracking-[0.3em] leading-none">RANKING</div>
        <div className="text-xl font-black text-[#00e5a0] tracking-wider leading-none" style={{ fontFamily: "monospace" }}>
          MUNDIAL26
        </div>
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function PhoneMockup() {
  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute inset-0 bg-[#25D366]/10 blur-3xl rounded-full scale-75" />

      {/* Phone frame */}
      <div className="relative w-85 bg-gray-200 rounded-[2.5rem] border-4 border-gray-300 shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="bg-gray-200 flex justify-center pt-2 pb-1">
          <div className="w-20 h-5 bg-gray-400 rounded-full" />
        </div>

        {/* WhatsApp header */}
        <div className="bg-[#075E54] px-3 py-2.5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-base">⚽</div>
          <div>
            <div className="font-bold text-white text-xs">FanBot Mundial 26</div>
            <div className="text-[#b2dfdb] text-[10px]">en línea</div>
          </div>
        </div>

        {/* Chat */}
        <div className="bg-[#e5ddd5] px-2.5 py-3 space-y-2.5"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8b8a2' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        >
          <ChatBubble from="bot">
            ¡Hola Carlos! 👋 Soy <strong>FanBot</strong>, tu guía del Mundial 2026 🏆<br />
            Ya quedaste inscrito. Te aviso 15 min antes de cada partido.
          </ChatBubble>

          <ChatBubble from="bot">
            ⚽ <strong>¡En 15 minutos arranca!</strong><br />
            🇲🇽 <strong>México</strong> vs 🇿🇦 <strong>Sudáfrica</strong><br />
            🏟 Estadio Azteca · 19:00 CDMX<br />
            👀 <strong>A seguir:</strong> Lozano, Giménez
          </ChatBubble>

          <ChatBubble from="user">
            ¿Cuántos mundiales ha ganado México?
          </ChatBubble>

          <ChatBubble from="bot">
            Ninguno aún, pero llegó a Cuartos en 1970 y 1986 🇲🇽 ¡El 2026 puede ser histórico! 🏆
          </ChatBubble>

          <div className="text-center text-[9px] text-gray-500 pt-1">FanBot · 3 consultas gratis/día</div>
        </div>

        {/* Input bar */}
        <div className="bg-gray-100 px-2.5 py-2 flex items-center gap-2">
          <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[11px] text-gray-400 border border-gray-200">
            Escribe un mensaje...
          </div>
          <div className="w-7 h-7 bg-[#25D366] rounded-full flex items-center justify-center text-xs">🎤</div>
        </div>

        {/* Home indicator */}
        <div className="bg-gray-100 flex justify-center py-1.5">
          <div className="w-16 h-1 bg-gray-400 rounded-full" />
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute -right-4 top-16 bg-[#CE1126] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg rotate-3">
        48 selecciones
      </div>
      <div className="absolute -left-6 bottom-24 bg-[#006847] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg -rotate-2">
        104 partidos
      </div>
    </div>
  );
}

function ChatBubble({ from, children }: { from: "bot" | "user"; children: React.ReactNode }) {
  if (from === "bot") {
    return (
      <div className="flex gap-2 max-w-[85%]">
        <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center text-sm shrink-0 mt-1">⚽</div>
        <div className="bg-white text-gray-800 text-xs rounded-2xl rounded-tl-none px-3 py-2 leading-relaxed shadow-sm">
          {children}
          <div className="text-[9px] text-gray-400 mt-1 text-right">ahora ✓✓</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <div className="bg-[#dcf8c6] text-gray-800 text-xs rounded-2xl rounded-tr-none px-3 py-2 max-w-[75%] leading-relaxed shadow-sm">
        {children}
        <div className="text-[9px] text-gray-500 mt-1 text-right">ahora ✓✓</div>
      </div>
    </div>
  );
}
