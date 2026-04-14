"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const schemas = [
    // ── SoftwareApplication ────────────────────────────────────────
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Prospekto",
      url: "https://prospekto.mx",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "CRM con bot de WhatsApp con IA para PyMEs. Responde automáticamente, califica leads y los asigna a tu equipo de ventas.",
      offers: {
        "@type": "Offer",
        price: "0.38",
        priceCurrency: "USD",
        priceValidUntil: "2026-12-31",
        availability: "https://schema.org/InStock",
        description: "Desde $0.38 USD/mes con 1,000 conversaciones",
      },
      featureList: [
        "Bot conversacional con IA en WhatsApp Business",
        "CRM con pipeline visual en tiempo real",
        "Asignación round-robin automática a vendedores",
        "Extracción automática de nombre, necesidad y presupuesto",
        "Historial completo de conversaciones",
        "Exportación CSV de leads",
        "Multi-negocio y multi-vendedor",
        "Notificación WhatsApp al vendedor asignado",
      ],
      screenshot: "https://prospekto.mx/Prospekt-app.png",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "38",
      },
    },

    // ── Organization ───────────────────────────────────────────────
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Prospekto",
      url: "https://prospekto.mx",
      logo: "https://prospekto.mx/Prospekt-app.png",
      description:
        "Empresa mexicana de software SaaS especializada en automatización de ventas por WhatsApp para PyMEs.",
      foundingLocation: {
        "@type": "Place",
        addressCountry: "MX",
      },
      sameAs: [],
    },

    // ── WebSite ────────────────────────────────────────────────────
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Prospekto",
      url: "https://prospekto.mx",
      description: "CRM + Bot WhatsApp con IA para PyMEs mexicanas",
      inLanguage: "es-MX",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://prospekto.mx/leads?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },

    // ── FAQPage ────────────────────────────────────────────────────
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "¿Qué es Prospekto?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Prospekto es un CRM con bot de WhatsApp impulsado por IA. Responde automáticamente a los mensajes de tus clientes, extrae sus datos (nombre, necesidad, presupuesto), califica su interés y asigna el lead al vendedor correcto de tu equipo, todo en piloto automático.",
          },
        },
        {
          "@type": "Question",
          name: "¿Cuánto cuesta Prospekto?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Prospekto funciona por pago de uso real. Con 1,000 conversaciones mensuales el costo es aproximadamente $0.38 USD al mes, sin tarifas fijas ni contratos. Puedes comenzar sin tarjeta de crédito.",
          },
        },
        {
          "@type": "Question",
          name: "¿Necesito saber programar para usar Prospekto?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Prospekto está diseñado para dueños de negocio y equipos de ventas. El setup se realiza en minutos desde el panel de administración, sin conocimientos técnicos.",
          },
        },
        {
          "@type": "Question",
          name: "¿Funciona con WhatsApp Business?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí. Prospekto se conecta a través de la API oficial de WhatsApp Business (Meta Cloud API), por lo que es completamente legal y estable.",
          },
        },
        {
          "@type": "Question",
          name: "¿Para qué tipo de negocios es ideal Prospekto?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Prospekto es ideal para PyMEs mexicanas que reciben leads por WhatsApp: inmobiliarias, escuelas, clínicas, talleres, refaccionarias, despachos y cualquier negocio con equipo de ventas que necesite atender clientes rápidamente.",
          },
        },
        {
          "@type": "Question",
          name: "¿Qué pasa si el bot no puede responder algo?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "El bot está entrenado con la información de tu negocio. Cuando recibe una consulta fuera de su alcance, captura los datos del cliente y asigna el lead a un vendedor humano para seguimiento, sin perder la conversación.",
          },
        },
      ],
    },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden font-sans" style={{ background: "linear-gradient(135deg, #ede9fe 0%, #d1fae5 55%, #fce7f3 100%)", color: "#1a2035" }}>
      {/* ── JSON-LD Schemas ── */}
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; }
        .serif { font-family: 'Instrument Serif', serif; }

        /* Fondo fijo para toda la página */
        body { background: linear-gradient(135deg, #ede9fe 0%, #d1fae5 55%, #fce7f3 100%); min-height: 100vh; }

        /* Nav glass */
        .nav-glass {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background: rgba(255,255,255,0.75);
          border-bottom: 1px solid rgba(255,255,255,0.9);
          box-shadow: 0 1px 20px rgba(0,0,0,0.06);
        }

        /* Pill badge */
        .pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(0,168,132,0.12);
          border: 1px solid rgba(0,168,132,0.3);
          color: #00875a;
          border-radius: 99px;
          padding: 6px 16px;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.01em;
        }

        .pill-dot {
          width: 6px; height: 6px;
          background: #00a884;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }

        /* Botón primario */
        .btn-primary {
          background: #00a884;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 14px 28px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
          box-shadow: 0 4px 20px rgba(0,168,132,0.3);
        }
        .btn-primary:hover { background: #008f70; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(0,168,132,0.4); }

        /* Botón secundario */
        .btn-secondary {
          background: rgba(255,255,255,0.7);
          color: #1a2035;
          border: 1.5px solid rgba(0,168,132,0.35);
          border-radius: 12px;
          padding: 14px 28px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }
        .btn-secondary:hover { background: rgba(0,168,132,0.08); border-color: #00a884; }

        /* Botón login nav */
        .btn-login {
          background: #00a884;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 8px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 2px 12px rgba(0,168,132,0.25);
        }
        .btn-login:hover { background: #008f70; transform: translateY(-1px); }

        /* Card glassmorphism */
        .glass-card {
          background: rgba(255,255,255,0.65);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 20px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 4px 24px rgba(100,80,180,0.08);
        }

        /* Pill card (pain points / benefits) */
        .pill-card {
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 50px;
          padding: 16px 24px;
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 12px rgba(100,80,180,0.07);
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 15px;
          color: #1a2035;
        }

        /* Feature card */
        .feat-card {
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 20px;
          padding: 28px;
          transition: all 0.25s;
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 16px rgba(100,80,180,0.07);
        }
        .feat-card:hover {
          background: rgba(255,255,255,0.85);
          box-shadow: 0 8px 32px rgba(0,168,132,0.12);
          transform: translateY(-2px);
        }

        /* Stats card */
        .stat-card {
          background: rgba(255,255,255,0.65);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 20px;
          padding: 28px 20px;
          text-align: center;
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 16px rgba(100,80,180,0.07);
        }

        /* Step card */
        .step-card {
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 20px;
          padding: 28px 20px;
          text-align: center;
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 12px rgba(100,80,180,0.06);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        /* Pricing card */
        .price-card {
          background: rgba(255,255,255,0.75);
          border: 1.5px solid rgba(0,168,132,0.25);
          border-radius: 24px;
          padding: 40px 36px;
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 40px rgba(0,168,132,0.12);
        }
        @media (max-width: 640px) { .price-card { padding: 28px 20px; } }

        /* Dark banner */
        .dark-banner {
          background: #1e2d3d;
          color: #fff;
          border-radius: 12px;
          padding: 14px 24px;
          font-size: 15px;
          font-weight: 500;
          display: inline-block;
        }
        .dark-banner span { color: #00a884; font-style: italic; }

        /* Chat bubble */
        .bubble-in {
          background: rgba(255,255,255,0.85);
          border-radius: 16px 16px 16px 4px;
          padding: 10px 14px;
          font-size: 13px;
          color: #1a2035;
          max-width: 240px;
          line-height: 1.5;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .bubble-out {
          background: #00a884;
          border-radius: 16px 16px 4px 16px;
          padding: 10px 14px;
          font-size: 13px;
          color: #fff;
          max-width: 260px;
          line-height: 1.5;
          align-self: flex-end;
        }
        .bubble-meta { font-size: 11px; color: #9ca3af; margin-top: 3px; }

        /* Animations */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.65s ease both; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }

        .check { color: #00a884; font-weight: 600; margin-right: 8px; }

        .sec-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #00a884;
        }

        /* Mobile menu */
        .mobile-menu {
          position: absolute;
          top: 64px; left: 0; right: 0;
          background: rgba(255,255,255,0.96);
          border-bottom: 1px solid rgba(0,168,132,0.15);
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        .mobile-menu a {
          font-size: 16px;
          color: #4b5563;
          text-decoration: none;
          padding: 8px 0;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
      `}</style>

      {/* ─── NAVBAR ─── */}
      <nav className="nav-glass sticky top-0 z-50 w-full" style={{ position: "relative" }}>
        <div className="flex items-center justify-between px-6 mx-auto" style={{ maxWidth: 1100, height: 64 }}>
          <div className="flex items-center gap-2">
            <Image src="/Prospekt-app.png" alt="Prospekto" width={32} height={32} className="rounded-lg" />
            <span style={{ fontSize: 17, fontWeight: 700, color: "#1a2035", letterSpacing: "-0.01em" }}>Prospekto</span>
          </div>

          {/* Desktop */}
          <div className="hidden sm:flex items-center gap-7">
            {["#pain", "#features", "#pricing"].map((href, i) => (
              <a key={href} href={href} style={{ fontSize: 14, color: "#6b7280", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#1a2035")}
                onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}>
                {["El problema", "Funciones", "Precio"][i]}
              </a>
            ))}
            <button className="btn-login" onClick={() => router.push("/login")}>Acceder →</button>
          </div>

          {/* Mobile */}
          <div className="flex sm:hidden items-center gap-3">
            <button className="btn-login" style={{ padding: "7px 14px", fontSize: 13 }} onClick={() => router.push("/login")}>Acceder</button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: "transparent", border: "none", color: "#1a2035", cursor: "pointer", padding: 4 }}>
              {mobileMenuOpen
                ? <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                : <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              }
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-menu sm:hidden">
            <a href="#pain" onClick={() => setMobileMenuOpen(false)}>El problema</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Funciones</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Precio</a>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section style={{ padding: "80px 24px 96px", textAlign: "center", position: "relative" }}>
        <div style={{ maxWidth: 740, margin: "0 auto" }}>
          <div className="fade-up" style={{ marginBottom: 24 }}>
            <span className="pill"><span className="pill-dot" /> CRM + Bot WhatsApp con IA para PyMEs</span>
          </div>

          <h1 className="serif fade-up delay-1" style={{ fontSize: "clamp(38px, 6vw, 70px)", fontWeight: 400, lineHeight: 1.1, marginBottom: 24, color: "#1a2035" }}>
            Tu próximo cliente ya<br />
            <span style={{ color: "#00a884", fontStyle: "italic" }}>te escribió</span> por WhatsApp.
          </h1>

          <p className="fade-up delay-2" style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "#6b7280", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 40px" }}>
            Prospekto responde, clasifica y asigna cada lead automáticamente — mientras tú duermes, vendes o haces otra cosa.
          </p>

          <div className="fade-up delay-3 flex flex-wrap justify-center gap-3">
            <button className="btn-primary" onClick={() => router.push("/login")}>Activar mi bot gratis →</button>
            <button className="btn-secondary" onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}>Ver cómo funciona</button>
          </div>

          <p className="fade-up delay-4" style={{ marginTop: 20, fontSize: 13, color: "#9ca3af" }}>
            Sin tarjeta de crédito · Desde $0.38 USD/mes · Setup en minutos
          </p>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section style={{ padding: "8px 24px 64px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
          {[
            { val: "78%", label: "compra con quien responde primero" },
            { val: "400%", label: "más conversiones en 5 min" },
            { val: "3 de 10", label: "clientes perdidos por tardanza" },
            { val: "24/7", label: "sin días libres ni fines de semana" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="serif" style={{ fontSize: "clamp(26px, 4vw, 36px)", color: "#00a884", fontWeight: 400, marginBottom: 6 }}>{s.val}</div>
              <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PAIN ─── */}
      <section id="pain" style={{ padding: "72px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="sec-label" style={{ marginBottom: 12 }}>El problema</div>
            <h2 className="serif" style={{ fontSize: "clamp(28px, 4vw, 46px)", fontWeight: 400, color: "#1a2035", marginBottom: 16 }}>
              ¿Te suena familiar?
            </h2>
            <div className="dark-banner">Cada mensaje sin respuesta = <span>dinero que se va</span></div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: "💬", text: "Recibes 50+ mensajes al día de clientes potenciales" },
              { icon: "🗓️", text: "Para cuando contestas, ya se fueron con la competencia" },
              { icon: "😓", text: "Tus vendedores no dan abasto" },
              { icon: "👎", text: "Los mensajes de noche y fines de semana quedan sin respuesta" },
              { icon: "📉", text: "Estás perdiendo ventas sin darte cuenta" },
            ].map((p) => (
              <div key={p.text} className="pill-card">
                <span style={{ fontSize: 22 }}>{p.icon}</span>
                <span>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DEMO CHAT ─── */}
      <section id="demo" style={{ padding: "72px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="sec-label" style={{ marginBottom: 16 }}>Así funciona</div>
            <h2 className="serif" style={{ fontSize: "clamp(26px, 4vw, 44px)", fontWeight: 400, lineHeight: 1.2, marginBottom: 20, color: "#1a2035" }}>
              De lead a oportunidad<br />
              <span style={{ fontStyle: "italic", color: "#00a884" }}>en segundos</span>
            </h2>
            <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.8, marginBottom: 28 }}>
              El cliente escribe a tu WhatsApp. La IA responde al instante, extrae nombre, necesidad y presupuesto, y asigna el lead al vendedor correcto — sin que toques nada.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {["Respuesta en menos de 3 segundos", "Extracción automática de datos con IA", "Asignación round-robin a tu equipo", "Dashboard en tiempo real"].map(f => (
                <div key={f} style={{ fontSize: 14, color: "#374151" }}>
                  <span className="check">✓</span>{f}
                </div>
              ))}
            </div>
          </div>

          {/* Chat mockup */}
          <div className="glass-card" style={{ overflow: "hidden" }}>
            <div style={{ background: "rgba(0,168,132,0.12)", padding: "14px 20px", borderBottom: "1px solid rgba(0,168,132,0.12)", display: "flex", alignItems: "center", gap: 10 }}>
              <Image src="/Prospekt-app.png" alt="Bot" width={36} height={36} className="rounded-full" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2035" }}>Mi Negocio</div>
                <div style={{ fontSize: 11, color: "#00a884" }}>● en línea</div>
              </div>
            </div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14, minHeight: 300, background: "rgba(248,250,252,0.6)" }}>
              <div>
                <div className="bubble-in">Hola! quería info sobre sus servicios de diseño, ¿cuánto cobran?</div>
                <div className="bubble-meta" style={{ marginLeft: 4 }}>2:17 am</div>
              </div>
              <div style={{ alignSelf: "flex-end" }}>
                <div className="bubble-out">¡Hola! Soy el asistente de Mi Negocio 👋 ¿Me puedes contar un poco más? ¿Es para logo, web o branding completo?</div>
                <div className="bubble-meta" style={{ textAlign: "right", marginRight: 4 }}>2:17 am · Bot ✓✓</div>
              </div>
              <div>
                <div className="bubble-in">Para una web completa, somos startup y tenemos como $30k de presupuesto</div>
                <div className="bubble-meta" style={{ marginLeft: 4 }}>2:18 am</div>
              </div>
              <div style={{ alignSelf: "flex-end" }}>
                <div className="bubble-out">Perfecto, con ese presupuesto podemos hacer algo increíble 🚀 ¿Cuándo tienes 20 min para una llamada?</div>
                <div className="bubble-meta" style={{ textAlign: "right", marginRight: 4 }}>2:18 am · Bot ✓✓</div>
              </div>
              <div style={{ background: "rgba(0,168,132,0.1)", border: "1px solid rgba(0,168,132,0.2)", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#00875a", lineHeight: 1.7 }}>
                <div style={{ fontWeight: 600, marginBottom: 4, color: "#006b47" }}>🤖 Lead capturado automáticamente</div>
                <div>Necesidad: Web completa · Presupuesto: $30k</div>
                <div>Asignado a: Carlos V.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" style={{ padding: "72px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="sec-label" style={{ marginBottom: 12 }}>Todo incluido</div>
            <h2 className="serif" style={{ fontSize: "clamp(26px, 4vw, 44px)", fontWeight: 400, color: "#1a2035" }}>
              Un solo sistema, cero fricciones
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {[
              { icon: "💬", title: "Bot conversacional con IA", desc: "Responde en lenguaje natural con el tono de tu negocio. GPT-4o-mini integrado, sin configuración compleja." },
              { icon: "🎯", title: "Extracción automática de datos", desc: "Nombre, necesidad, presupuesto y estado — extraídos de la conversación sin formularios." },
              { icon: "⚡", title: "Asignación round-robin", desc: "Cada lead se asigna al siguiente vendedor disponible. Justo, automático y sin conflictos internos." },
              { icon: "📊", title: "CRM visual en tiempo real", desc: "Pipeline, lista y detalle de cada lead. Filtros por estado, historial completo y exportación CSV." },
              { icon: "🔔", title: "Multi-negocio y multi-vendedor", desc: "Maneja 2+ cuentas de WhatsApp con equipos separados desde un solo dashboard." },
              { icon: "💰", title: "Costo ridículamente bajo", desc: "~$0.38 USD al mes con 1,000 conversaciones. Sin planes de $99/mes que nadie usa al 100%." },
            ].map((f) => (
              <div key={f.title} className="feat-card">
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#1a2035", marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" style={{ padding: "72px 24px 96px" }}>
        <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
          <div className="sec-label" style={{ marginBottom: 12 }}>Precio</div>
          <h2 className="serif" style={{ fontSize: "clamp(26px, 4vw, 44px)", fontWeight: 400, color: "#1a2035", marginBottom: 36 }}>
            Sin sorpresas en la factura
          </h2>
          <div className="price-card">
            <div style={{ fontSize: 13, color: "#00a884", fontWeight: 600, marginBottom: 8 }}>Pago por uso real</div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6, marginBottom: 4 }}>
              <span className="serif" style={{ fontSize: "clamp(40px, 10vw, 60px)", color: "#1a2035", fontWeight: 400 }}>$0.38</span>
              <span style={{ fontSize: 16, color: "#9ca3af" }}>USD / mes</span>
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 32 }}>Con 1,000 conversaciones mensuales</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left", marginBottom: 32 }}>
              {[
                "Bot de WhatsApp con IA incluido",
                "CRM completo con pipeline visual",
                "Hasta 4 vendedores simultáneos",
                "2+ cuentas de WhatsApp",
                "Exportación CSV de leads",
                "Historial completo de conversaciones",
                "Dashboard en tiempo real",
              ].map(f => (
                <div key={f} style={{ fontSize: 14, color: "#374151" }}>
                  <span className="check">✓</span>{f}
                </div>
              ))}
            </div>

            <button className="btn-primary" style={{ width: "100%", fontSize: 16, padding: "16px", borderRadius: 14 }} onClick={() => router.push("/login")}>
              Empezar ahora — es gratis →
            </button>
            <div style={{ marginTop: 14, fontSize: 12, color: "#9ca3af" }}>Sin tarjeta de crédito para comenzar</div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: "1px solid rgba(0,0,0,0.07)", padding: "32px 24px", textAlign: "center", background: "rgba(255,255,255,0.4)" }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Image src="/Prospekt-app.png" alt="Prospekto" width={24} height={24} className="rounded-md" />
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1a2035" }}>Prospekto</span>
        </div>
        <div style={{ fontSize: 13, color: "#9ca3af" }}>
          CRM + Bot WhatsApp para PyMEs mexicanas · {new Date().getFullYear()}
        </div>
      </footer>
    </main>
  );
}
