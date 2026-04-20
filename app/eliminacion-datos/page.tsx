import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Eliminación de Datos — Ranking Mundial 26",
  description: "Instrucciones para solicitar la eliminación de tus datos personales y baja del servicio de Ranking Mundial 26.",
  alternates: { canonical: "/eliminacion-datos" },
};

export default function EliminacionDatosPage() {
  return (
    <main
      className="min-h-screen font-sans"
      style={{ background: "#f9fafb", color: "#1a2035" }}
    >
      <style>{`
        .prose h2 { font-size: 20px; font-weight: 600; color: #1a2035; margin: 36px 0 12px; }
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
          Eliminación de Datos
        </h1>

        <div className="disclaimer-box">
          <p>
            <strong>Baja rápida:</strong> Si solo deseas dejar de recibir alertas y borrar tu número de nuestro sistema, simplemente envía <strong>STOP</strong> o <strong>BAJA</strong> a nuestro número de WhatsApp. Tu registro será cancelado automáticamente.
          </p>
        </div>

        <div className="prose">
          <p>
            En <strong>Ranking Mundial 26</strong> respetamos tu derecho a la privacidad y te facilitamos el proceso para solicitar la eliminación permanente de tu información personal de nuestras bases de datos, en cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
          </p>

          <h2>¿Qué datos se eliminan?</h2>
          <p>Al solicitar la eliminación de tus datos, borraremos de forma permanente:</p>
          <ul>
            <li>Tu número de WhatsApp.</li>
            <li>Tus preferencias (como tu selección favorita).</li>
            <li>Tu historial de interacciones con nuestro FanBot.</li>
            <li>Cualquier otro dato personal identificable asociado a tu cuenta.</li>
          </ul>

          <h2>Método 1: Baja automática vía WhatsApp (Recomendado)</h2>
          <p>
            La forma más rápida de eliminar tus datos es a través del mismo canal por el que te registraste. 
            Envía un mensaje con la palabra <strong>STOP</strong> o <strong>BAJA</strong> a nuestro FanBot. 
            El sistema detectará tu solicitud, detendrá el envío de alertas inmediatamente y programará tu registro para eliminación.
          </p>

          <h2>Método 2: Solicitud por correo electrónico</h2>
          <p>
            Si ya no tienes acceso a la cuenta de WhatsApp con la que te registraste o prefieres realizar una solicitud formal (Derechos ARCO), puedes enviarnos un correo electrónico:
          </p>
          <ul>
            <li><strong>Correo:</strong> <a href="mailto:admin@rankingagencia.com">admin@rankingagencia.com</a></li>
            <li><strong>Asunto:</strong> Solicitud de Eliminación de Datos - [Tu número de WhatsApp incluyendo código de país]</li>
            <li><strong>Cuerpo del correo:</strong> Por favor, indica tu número de WhatsApp y menciona que deseas eliminar todos tus datos del servicio "Ranking Mundial 26".</li>
          </ul>
          <p>
            Procesaremos tu solicitud y te enviaremos una confirmación en un plazo máximo de 20 días hábiles.
          </p>

          <h2>Retención por obligaciones legales</h2>
          <p>
            Ten en cuenta que podríamos retener cierta información anónima o registros agregados (que no te identifican personalmente) para fines estadísticos, o bien retener datos temporalmente si existe una obligación legal que nos lo exija.
          </p>
        </div>
      </div>

      <footer style={{ borderTop: "1px solid #e5e7eb", padding: "28px 24px", textAlign: "center", background: "#fff" }}>
        <div style={{ fontSize: 13, color: "#9ca3af", display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "#9ca3af", textDecoration: "none" }}>Inicio</Link>
          <Link href="/condiciones" style={{ color: "#9ca3af", textDecoration: "none" }}>Condiciones del Servicio</Link>
          <Link href="/privacidad" style={{ color: "#9ca3af", textDecoration: "none" }}>Política de Privacidad</Link>
          <Link href="/eliminacion-datos" style={{ color: "#006847", textDecoration: "none" }}>Eliminación de Datos</Link>
        </div>
        <p style={{ fontSize: 12, color: "#d1d5db", marginTop: 16 }}>© 2026 Ranking Agencia · admin@rankingagencia.com · 811 299 3097</p>
      </footer>
    </main>
  );
}
