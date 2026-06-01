import { createClient } from "@/lib/supabase/server";
import CountdownBanner from "./components/CountdownBanner";

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
      <nav className="bg-black shadow-md">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <a href="/">
            <img src="/mifanbot-h.svg" alt="MiFanBot" width={140} height={36} />
          </a>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=Hola%20FanBot%2C%20quiero%20mis%20alertas%20del%20Mundial%202026`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm border border-white text-white px-4 py-2 rounded-full hover:bg-white hover:text-black transition-all font-medium"
          >
            Unirme gratis
          </a>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────── */}
      <section className="bg-white px-6 pt-10 pb-16 overflow-hidden">
        <div className="max-w-6xl mx-auto">

          {/* Logo + badge */}
          <div className="flex items-center gap-4 mb-8">
            <img src="/mifanbot.svg" alt="MiFanBot" width={64} height={64} />
            <div>
              <p className="text-[#00A550] text-[10px] font-bold uppercase tracking-widest">Transmisión en vivo · Canal FanBot</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-[#00A550] text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-wide">En pantalla</span>
                <span className="bg-black text-[#00A550] text-[10px] font-black px-2 py-0.5 uppercase tracking-wide animate-pulse">Chat · Alerta en vivo</span>
              </div>
            </div>
          </div>

          {/* Headline + mockup */}
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="font-black uppercase leading-none text-gray-900 mb-6"
                style={{ fontSize: "clamp(3rem, 10vw, 7rem)", lineHeight: 0.95 }}>
                Tus<br />
                Alertas<br />
                del<br />
                <span className="text-[#00A550]">Mundial,</span><br />
                <span className="text-4xl sm:text-5xl">a tu celular.</span>
              </h1>

              <p className="text-gray-600 text-base mb-8 max-w-md leading-relaxed">
                Mi FanBot es tu narrador personal. Te avisa <strong className="text-gray-900">15 min antes</strong>, te manda goles, rojas y resultado en vivo, y responde lo que le preguntes. Todo por WhatsApp.
              </p>

              <div className="flex flex-wrap items-center gap-4 mb-10">
                <a
                  href={`https://wa.me/${WA_NUMBER}?text=Hola%20FanBot%2C%20quiero%20mis%20alertas%20del%20Mundial%202026`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20c05c] text-black font-black text-base px-7 py-4 uppercase tracking-wide transition-all"
                >
                  <WhatsAppIcon />
                  Activar mis alertas
                </a>
                <p className="text-gray-400 text-xs uppercase tracking-widest">Sin app · Sin login · Solo WhatsApp</p>
              </div>

              {/* Stats */}
              <div className="flex gap-8 border-t border-gray-100 pt-6">
                {[
                  { n: "48", label: "Equipos" },
                  { n: "104", label: "Partidos" },
                  { n: "16", label: "Sedes" },
                  { n: `15"`, label: "Tiempo real" },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-xl font-black text-gray-900">{s.n}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phone mockup */}
            <div className="flex justify-center lg:justify-end">
              <PhoneMockup />
            </div>
          </div>
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
                <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-[#00A550]/40 hover:shadow-md transition-all">
                  <div className="text-xs text-[#00A550] mb-2 font-semibold">
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
      <section className="bg-black py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-[#00A550] text-xs font-bold uppercase tracking-widest mb-2">Manual del hincha · 03 pasos</p>
          <h2 className="text-white font-black text-3xl sm:text-4xl uppercase mb-14">
            Se activa en<br /><span className="text-[#00A550]">cuatro segundos.</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-0 border-t border-white/10">
            {[
              { n: "01", title: "ESCRÍBENOS.", desc: "Manda un mensaje al número de FanBot. No te pide mail, ni nombre, ni nada raro." },
              { n: "02", title: "RECIBES.", desc: "15 minutos antes de cada partido te llega el aviso con info del juego y dónde verlo." },
              { n: "03", title: "PREGUNTAS.", desc: "¿Quién va primero? ¿Quién jugó la final del 86? ¿Cuándo es la próxima de México? Pregunta lo que quieras." },
            ].map((s, i) => (
              <div key={s.n} className={`py-10 ${i < 2 ? "sm:border-r border-white/10" : ""} sm:px-10 first:pl-0`}>
                <p className="text-[#00A550] text-xs font-bold uppercase tracking-widest mb-4">PASO {s.n}</p>
                <h3 className="text-white font-black text-3xl sm:text-4xl uppercase mb-4 leading-tight">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CountdownBanner />

      {/* ── PRONÓSTICOS ───────────────────────────────── */}
      <section className="bg-black py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-[#00A550] text-xs font-bold uppercase tracking-widest mb-2">Funcionalidad destacada</p>
          <h2 className="text-white font-black text-3xl sm:text-5xl uppercase mb-14">
            Pronósticos<br /><span className="text-[#00A550]">del Mundial.</span>
          </h2>

          <div className="grid sm:grid-cols-2 gap-0 border-t border-white/10">
            {/* Pronostica */}
            <div className="py-10 sm:border-r border-white/10 sm:pr-10">
              <p className="text-[#00A550] text-xs font-bold uppercase tracking-widest mb-4">/ Jugar</p>
              <h3 className="text-white font-black text-2xl sm:text-3xl uppercase mb-4 leading-tight">
                Pronostica<br />por WhatsApp.
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Antes de cada partido das tu pick con un toque: Local, Empate o Visita. Al terminar te avisamos el resultado y acumulas puntos.
              </p>
              <ul className="space-y-2 mb-8">
                {[
                  "Pick con un toque desde WhatsApp",
                  "Notificación al terminar el partido",
                  "Historial completo en mifanbot.com",
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-[#00A550] font-black">✓</span> {item}
                  </li>
                ))}
              </ul>
              <a
                href="/pronosticos/jornada/1"
                className="inline-block bg-[#00A550] hover:bg-green-600 text-white font-black text-sm px-6 py-3 uppercase tracking-wide transition-colors"
              >
                Pronosticar 1ra Jornada →
              </a>
            </div>

            {/* Grupos */}
            <div className="py-10 sm:pl-10">
              <p className="text-[#00A550] text-xs font-bold uppercase tracking-widest mb-4">/ Grupos</p>
              <h3 className="text-white font-black text-2xl sm:text-3xl uppercase mb-4 leading-tight">
                Grupos<br />Privados.
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Familia, oficina, banda del barrio. Código exclusivo, ranking privado y resultados en vivo por WhatsApp.
              </p>
              <div className="border border-white/10 p-4 mb-8">
                <p className="text-[#00A550] text-xs font-bold uppercase tracking-widest mb-1">Código de grupo</p>
                <p className="text-white font-black text-2xl tracking-widest">FAN-2026</p>
                <p className="text-gray-500 text-xs mt-2 uppercase tracking-wide">Precio · <span className="text-[#00A550] font-bold">Gratis</span></p>
              </div>
              <a
                href="/quiniela/ligas/nueva"
                className="inline-block bg-white hover:bg-gray-100 text-black font-black text-sm px-6 py-3 uppercase tracking-wide transition-colors"
              >
                Crear mi Grupo →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────── */}
      <section className="bg-black py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#00A550] text-xs font-bold uppercase tracking-widest mb-4">Fin del demo · Inicio de tu temporada</p>
          <h2 className="text-white font-black text-5xl sm:text-7xl uppercase leading-none mb-4">
            Actívate ahora.
          </h2>
          <h2 className="text-[#00A550] font-black text-5xl sm:text-7xl uppercase leading-none mb-12">
            Mira el Mundial<br />como nunca.
          </h2>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=Hola%20FanBot%2C%20quiero%20mis%20alertas%20del%20Mundial%202026`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20c05c] text-black font-black text-lg px-10 py-5 transition-all uppercase tracking-wide"
          >
            <WhatsAppIcon />
            Empezar gratis por WhatsApp
          </a>
          <p className="text-white/30 text-xs mt-5 uppercase tracking-widest">Tarda 4 segundos · Cero compromiso</p>
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
          <p className="text-xs text-gray-400">© 2026 MiFanBot</p>
        </div>
        <p className="text-center text-[10px] text-gray-300 mt-4 max-w-xl mx-auto">
          MiFanBot es un servicio independiente de información y entretenimiento para aficionados al fútbol. No está afiliado, patrocinado ni respaldado por FIFA ni por ninguna entidad organizadora del torneo.
        </p>
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
            ¡Hola Carlos! 👋 Soy <strong>FanBot</strong>, tu asistente de fútbol ⚽<br />
            Ya quedaste inscrito. Te aviso 15 min antes de cada partido.
          </ChatBubble>

          <ChatBubble from="bot">
            ⚽ <strong>¡En 15 minutos arranca!</strong><br />
            🇲🇽 <strong>México</strong> vs 🇿🇦 <strong>Sudáfrica</strong><br />
            🏟 Estadio Azteca · 19:00 CDMX<br />
            📺 <strong>Donde ver:</strong> Vix, TUDN, Canal 5
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
      <div className="absolute -left-6 bottom-24 bg-[#00A550] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg -rotate-2">
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
