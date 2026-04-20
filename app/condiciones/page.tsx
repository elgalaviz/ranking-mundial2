import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Condiciones del Servicio — Ranking Mundial 26",
  description: "Condiciones del servicio de Ranking Mundial 26. Lee los términos que rigen el uso del servicio de alertas del Mundial 2026.",
  alternates: { canonical: "/condiciones" },
};

export default function CondicionesPage() {
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
          Condiciones del Servicio
        </h1>

        <div className="disclaimer-box">
          <p>
            <strong>⚠️ Consentimiento de mensajes WhatsApp:</strong> Al registrarte en Ranking Mundial 26
            proporcionando tu número de WhatsApp, aceptas expresamente recibir mensajes vía WhatsApp que
            incluyen alertas de partidos, información del Mundial 2026, y mensajes publicitarios de
            patrocinadores. Puedes cancelar en cualquier momento respondiendo <strong>STOP</strong> o{" "}
            <strong>BAJA</strong>.
          </p>
        </div>

        <div className="prose">
          <p>
            Bienvenido a <strong>Ranking Mundial 26</strong>, operado por <strong>Ranking Agencia</strong>.
            Al registrarte y usar este servicio, aceptas las presentes Condiciones del Servicio. Si no estás
            de acuerdo, te pedimos no utilizar el servicio.
          </p>

          <h2>1. Descripción del servicio</h2>
          <p>
            Ranking Mundial 26 es un servicio gratuito de alertas deportivas vía WhatsApp para el
            Mundial de Fútbol 2026. Incluye: alertas automáticas 15 minutos antes de cada partido,
            acceso a un FanBot con hasta 3 consultas diarias gratuitas, calendario descargable (.ics),
            y contenido patrocinado de marcas aliadas.
          </p>

          <h2>2. Registro</h2>
          <ul>
            <li>El registro se realiza al enviar cualquier mensaje al número de WhatsApp del servicio.</li>
            <li>Debes tener al menos 18 años para registrarte.</li>
            <li>Solo se admite un registro por número de WhatsApp.</li>
            <li>El registro implica la aceptación expresa de estas condiciones y la{" "}
              <Link href="/privacidad">Política de Privacidad</Link>.</li>
          </ul>

          <h2>3. Consentimiento para publicidad vía WhatsApp</h2>
          <p>
            Al registrarte, otorgas tu consentimiento expreso e inequívoco para recibir en tu número de
            WhatsApp los siguientes tipos de mensajes:
          </p>
          <ul>
            <li>Alertas automáticas de partidos del Mundial 2026.</li>
            <li>Actualizaciones de resultados y clasificaciones.</li>
            <li>Mensajes publicitarios y promocionales de patrocinadores y marcas aliadas.</li>
            <li>Comunicaciones informativas sobre el servicio.</li>
          </ul>
          <p>
            Puedes revocar este consentimiento en cualquier momento respondiendo <strong>STOP</strong> o{" "}
            <strong>BAJA</strong> a cualquier mensaje. La revocación cancela tu registro y cesa el envío
            de todos los tipos de mensajes.
          </p>

          <h2>4. Uso aceptable</h2>
          <ul>
            <li>El servicio es para uso personal y no comercial.</li>
            <li>No debes intentar abusar, hackear o sobrecargar el sistema.</li>
            <li>No debes usar el FanBot para generar contenido inapropiado o ilegal.</li>
            <li>Debes cumplir con las{" "}
              <a href="https://www.whatsapp.com/legal/business-policy" target="_blank" rel="noopener noreferrer">
                Políticas de WhatsApp Business
              </a>{" "}de Meta.</li>
          </ul>

          <h2>5. FanBot — Límite de consultas</h2>
          <p>
            El FanBot está disponible de forma gratuita con un límite de <strong>3 consultas por día</strong>{" "}
            por usuario. Este límite puede modificarse en el futuro con previo aviso. El límite se reinicia
            a medianoche hora de México (CDMX).
          </p>

          <h2>6. Integración con WhatsApp / Meta</h2>
          <p>
            Este servicio opera mediante la API oficial de WhatsApp Business (Meta Cloud API). Ranking Mundial 26
            no es un producto de Meta y Meta no respalda ni es responsable de este servicio. Meta puede
            suspender el acceso a la API en cualquier momento por razones fuera de nuestro control.
          </p>

          <h2>7. Contenido patrocinado</h2>
          <p>
            Ranking Mundial 26 puede incluir mensajes publicitarios de patrocinadores en las alertas de
            partidos y comunicaciones del servicio. Este contenido estará claramente identificado como
            patrocinado cuando sea posible. Los patrocinadores no tienen acceso a tus datos personales
            identificables.
          </p>

          <h2>8. Propiedad intelectual</h2>
          <p>
            El código, diseño, marca y contenido de Ranking Mundial 26 son propiedad de Ranking Agencia.
            Los datos del Mundial 2026 son de dominio público (FIFA). No adquieres ningún derecho sobre
            el servicio al usarlo.
          </p>

          <h2>9. Disponibilidad del servicio</h2>
          <p>
            Nos esforzamos por mantener el servicio activo durante todo el Mundial 2026. Sin embargo,
            pueden ocurrir interrupciones por mantenimiento, fallas técnicas o causas de fuerza mayor.
            No garantizamos disponibilidad ininterrumpida y no seremos responsables por alertas no
            entregadas debido a fallas del sistema.
          </p>

          <h2>10. Limitación de responsabilidad</h2>
          <p>
            Ranking Agencia no será responsable por daños derivados de: alertas entregadas fuera de
            tiempo, información incorrecta sobre partidos (sujeta a cambios por FIFA), interrupciones
            del servicio de WhatsApp, o decisiones tomadas con base en el contenido del FanBot.
          </p>

          <h2>11. Baja del servicio</h2>
          <p>
            Puedes darte de baja en cualquier momento respondiendo <strong>STOP</strong> o{" "}
            <strong>BAJA</strong> a cualquier mensaje. Tus datos se eliminarán conforme a nuestra{" "}
            <Link href="/eliminacion-datos">política de eliminación de datos</Link> dentro de los 30 días
            siguientes a la solicitud.
          </p>

          <h2>12. Cambios a las condiciones</h2>
          <p>
            Podemos actualizar estas condiciones con un aviso de al menos 15 días vía WhatsApp. El uso
            continuado del servicio después del aviso implica la aceptación de los cambios.
          </p>

          <h2>13. Ley aplicable</h2>
          <p>
            Estas condiciones se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier
            controversia se someterá a los tribunales competentes del estado de Nuevo León, México.
          </p>

          <h2>14. Contacto</h2>
          <p>
            ¿Preguntas sobre estas condiciones? Contáctanos:<br />
            📧 <a href="mailto:admin@rankingagencia.com">admin@rankingagencia.com</a><br />
            📞 <a href="tel:8112993097">811 299 3097</a>
          </p>
        </div>
      </div>

      <footer style={{ borderTop: "1px solid #e5e7eb", padding: "28px 24px", textAlign: "center", background: "#fff" }}>
        <div style={{ fontSize: 13, color: "#9ca3af", display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "#9ca3af", textDecoration: "none" }}>Inicio</Link>
          <Link href="/condiciones" style={{ color: "#006847", textDecoration: "none" }}>Condiciones del Servicio</Link>
          <Link href="/privacidad" style={{ color: "#9ca3af", textDecoration: "none" }}>Política de Privacidad</Link>
          <Link href="/eliminacion-datos" style={{ color: "#9ca3af", textDecoration: "none" }}>Eliminación de Datos</Link>
        </div>
        <p style={{ fontSize: 12, color: "#d1d5db", marginTop: 16 }}>© 2026 Ranking Agencia · admin@rankingagencia.com · 811 299 3097</p>
      </footer>
    </main>
  );
}
