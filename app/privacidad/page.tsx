import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad — Mi FanBot",
  description: "Política de privacidad de Mi FanBot. Conoce cómo recopilamos, usamos y protegemos tu información personal.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <main
      className="min-h-screen font-sans"
      style={{ background: "#f9fafb", color: "#1a2035" }}
    >
      <style>{`
        .prose h2 { font-size: 20px; font-weight: 600; color: #1a2035; margin: 36px 0 12px; }
        .prose h3 { font-size: 16px; font-weight: 600; color: #374151; margin: 24px 0 8px; }
        .prose p, .prose li { font-size: 15px; color: #4b5563; line-height: 1.8; margin-bottom: 12px; }
        .prose ul { padding-left: 20px; }
        .prose li { list-style: disc; }
        .prose a { color: #006847; text-decoration: underline; }
        .disclaimer-box { background: #fff3cd; border-left: 4px solid #CE1126; border-radius: 8px; padding: 20px 24px; margin: 32px 0; }
        .disclaimer-box p { color: #1a2035 !important; font-size: 15px !important; margin: 0 !important; line-height: 1.7 !important; }
      `}</style>

      <nav style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#006847", letterSpacing: "-0.5px" }}>
              RANKING <span style={{ color: "#CE1126" }}>MUNDIAL</span> 26
            </span>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px 96px" }}>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>Última actualización: abril 2026</p>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 32, color: "#1a2035" }}>
          Política de Privacidad
        </h1>

        <div className="disclaimer-box">
          <p>
            <strong>⚠️ Aviso importante sobre mensajes de WhatsApp:</strong> Al proporcionar tu número de WhatsApp
            y registrarte en Mi FanBot, otorgas tu consentimiento expreso para recibir mensajes de
            WhatsApp que incluyen: alertas de partidos del Mundial 2026, información deportiva, y mensajes
            promocionales o publicitarios de patrocinadores y marcas aliadas. Puedes cancelar en cualquier
            momento respondiendo <strong>STOP</strong> o <strong>BAJA</strong> a cualquier mensaje.
          </p>
        </div>

        <div className="prose">
          <p>
            En <strong>Mi FanBot</strong> ("nosotros", "nuestro" o "el servicio"), respetamos tu privacidad
            y nos comprometemos a proteger la información personal que compartes con nosotros a través de
            <strong>Mi FanBot</strong>. Esta Política de Privacidad describe qué datos recopilamos,
            cómo los usamos y cuáles son tus derechos.
          </p>

          <h2>1. Responsable del tratamiento</h2>
          <p>
            <strong>Mi FanBot</strong> es el responsable del tratamiento de tus datos personales.<br />
            Teléfono: <a href="tel:8112993097">811 299 3097</a><br />
            Correo: <a href="mailto:admin@rankingagencia.com">admin@rankingagencia.com</a>
          </p>

          <h2>2. Información que recopilamos</h2>
          <ul>
            <li><strong>Número de WhatsApp:</strong> al enviarnos un mensaje te registras automáticamente en el servicio.</li>
            <li><strong>Nombre:</strong> el nombre de perfil de WhatsApp que compartes con nosotros.</li>
            <li><strong>País de origen:</strong> inferido del código de área de tu número telefónico.</li>
            <li><strong>Historial de mensajes:</strong> conversaciones con el FanBot para mejorar el servicio.</li>
            <li><strong>Datos de uso:</strong> registros de alertas enviadas y partidos consultados.</li>
          </ul>

          <h2>3. Consentimiento para mensajes de WhatsApp</h2>
          <p>
            Al interactuar con Ranking Mundial 26 vía WhatsApp, aceptas expresamente recibir:
          </p>
          <ul>
            <li>Alertas automáticas 15 minutos antes de cada partido del Mundial 2026.</li>
            <li>Información sobre resultados, grupos y calendario del torneo.</li>
            <li>Mensajes promocionales y publicitarios de patrocinadores del servicio.</li>
            <li>Comunicaciones informativas sobre el servicio.</li>
          </ul>
          <p>
            Este consentimiento es revocable en cualquier momento respondiendo <strong>STOP</strong> o
            <strong> BAJA</strong> a cualquier mensaje. La revocación no afecta la legalidad del tratamiento
            previo a la misma.
          </p>

          <h2>4. Cómo usamos tu información</h2>
          <ul>
            <li>Enviarte alertas de partidos del Mundial 2026 en tiempo real.</li>
            <li>Operar el FanBot para responder tus preguntas sobre el Mundial.</li>
            <li>Mejorar la calidad y relevancia de los mensajes enviados.</li>
            <li>Enviar contenido patrocinado por marcas aliadas al servicio.</li>
            <li>Cumplir con obligaciones legales aplicables en México.</li>
          </ul>

          <h2>5. Uso de inteligencia artificial</h2>
          <p>
            Mi FanBot utiliza modelos de lenguaje de OpenAI (gpt-4o-mini) para procesar consultas
            en el FanBot. Los mensajes se envían a la API de OpenAI de forma cifrada. No utilizamos estos
            datos para entrenar modelos externos.
          </p>

          <h2>6. Compartición de datos</h2>
          <p>No vendemos ni alquilamos tu información personal. Podemos compartir datos únicamente con:</p>
          <ul>
            <li><strong>Meta (WhatsApp Business API):</strong> para el envío de mensajes.</li>
            <li><strong>OpenAI:</strong> procesamiento de consultas del FanBot.</li>
            <li><strong>Supabase:</strong> almacenamiento seguro de datos.</li>
            <li><strong>Vercel:</strong> hospedaje de la aplicación.</li>
            <li><strong>Patrocinadores:</strong> únicamente métricas agregadas y anónimas (nunca datos personales identificables).</li>
            <li><strong>Autoridades competentes:</strong> cuando la ley mexicana lo exija.</li>
          </ul>

          <h2>7. Almacenamiento y seguridad</h2>
          <p>
            Tus datos se almacenan en servidores seguros con cifrado en tránsito (TLS) y en reposo.
            Implementamos controles de acceso y revisiones periódicas de seguridad.
          </p>

          <h2>8. Retención de datos</h2>
          <p>
            Conservamos tus datos mientras seas usuario activo del servicio. Al solicitar tu baja, eliminamos
            o anonimizamos tu información dentro de los 30 días siguientes, salvo obligación legal de
            conservarla por más tiempo.
          </p>

          <h2>9. Tus derechos (ARCO)</h2>
          <p>Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (México), tienes derecho a:</p>
          <ul>
            <li><strong>Acceso:</strong> conocer qué datos tenemos sobre ti.</li>
            <li><strong>Rectificación:</strong> corregir datos inexactos.</li>
            <li><strong>Cancelación:</strong> solicitar la eliminación de tus datos.</li>
            <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos para fines publicitarios.</li>
          </ul>
          <p>
            Para ejercer tus derechos, escríbenos a{" "}
            <a href="mailto:admin@rankingagencia.com">admin@rankingagencia.com</a> o llámanos al{" "}
            <a href="tel:8112993097">811 299 3097</a>.
          </p>

          <h2>10. Cookies</h2>
          <p>
            Utilizamos únicamente cookies de sesión esenciales para el funcionamiento del sitio web.
            No utilizamos cookies de seguimiento publicitario de terceros.
          </p>

          <h2>11. Menores de edad</h2>
          <p>
            Este servicio está dirigido a mayores de 18 años. No recopilamos datos de menores
            de forma intencionada.
          </p>

          <h2>12. Cambios a esta política</h2>
          <p>
            Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos via WhatsApp
            ante cambios sustanciales. El uso continuado del servicio implica tu aceptación.
          </p>

          <h2>13. Contacto</h2>
          <p>
            ¿Tienes preguntas sobre esta política? Contáctanos:<br />
            📧 <a href="mailto:admin@rankingagencia.com">admin@rankingagencia.com</a><br />
            📞 <a href="tel:8112993097">811 299 3097</a>
          </p>
        </div>
      </div>

      <footer style={{ borderTop: "1px solid #e5e7eb", padding: "28px 24px", textAlign: "center", background: "#fff" }}>
        <div style={{ fontSize: 13, color: "#9ca3af", display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "#9ca3af", textDecoration: "none" }}>Inicio</Link>
          <Link href="/condiciones" style={{ color: "#9ca3af", textDecoration: "none" }}>Condiciones del Servicio</Link>
          <Link href="/privacidad" style={{ color: "#006847", textDecoration: "none" }}>Política de Privacidad</Link>
          <Link href="/eliminacion-datos" style={{ color: "#9ca3af", textDecoration: "none" }}>Eliminación de Datos</Link>
        </div>
        <p style={{ fontSize: 12, color: "#d1d5db", marginTop: 16 }}>© 2026 Mi FanBot · admin@rankingagencia.com · 811 299 3097</p>
      </footer>
    </main>
  );
}
