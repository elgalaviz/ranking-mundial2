import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de privacidad de Prospekto. Conoce cómo recopilamos, usamos y protegemos tu información personal.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <main
      className="min-h-screen font-sans"
      style={{
        background: "linear-gradient(135deg, #ede9fe 0%, #d1fae5 55%, #fce7f3 100%)",
        color: "#1a2035",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        body { font-family: 'DM Sans', sans-serif; }
        .serif { font-family: 'Instrument Serif', serif; }
        .prose h2 { font-size: 20px; font-weight: 600; color: #1a2035; margin: 36px 0 12px; }
        .prose h3 { font-size: 16px; font-weight: 600; color: #374151; margin: 24px 0 8px; }
        .prose p, .prose li { font-size: 15px; color: #4b5563; line-height: 1.8; margin-bottom: 12px; }
        .prose ul { padding-left: 20px; }
        .prose li { list-style: disc; }
        .prose a { color: #00a884; text-decoration: underline; }
      `}</style>

      {/* Nav mínima */}
      <nav style={{ backdropFilter: "blur(20px)", background: "rgba(255,255,255,0.75)", borderBottom: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 1px 20px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <Image src="/Prospekt-icono.png" alt="Prospekto" width={36} height={36} className="rounded-lg" />
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1a2035" }}>PROSPEKTO</span>
          </Link>
        </div>
      </nav>

      {/* Contenido */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px 96px" }}>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>Última actualización: abril 2025</p>
        <h1 className="serif" style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 400, lineHeight: 1.15, marginBottom: 32, color: "#1a2035" }}>
          Política de Privacidad
        </h1>

        <div className="prose">
          <p>
            En <strong>Prospekto</strong> ("nosotros", "nuestro" o "la plataforma"), respetamos tu privacidad y nos
            comprometemos a proteger la información personal que compartes con nosotros. Esta Política de Privacidad
            describe qué datos recopilamos, cómo los usamos y cuáles son tus derechos.
          </p>

          <h2>1. Información que recopilamos</h2>
          <p>Recopilamos información en las siguientes categorías:</p>
          <ul>
            <li><strong>Datos de cuenta:</strong> nombre, correo electrónico y número de teléfono al registrarte.</li>
            <li><strong>Datos de negocio:</strong> nombre del negocio, descripción, catálogo de productos/servicios y configuración del bot.</li>
            <li><strong>Datos de leads:</strong> conversaciones de WhatsApp, nombre del prospecto, necesidad, presupuesto y estado del lead.</li>
            <li><strong>Datos de uso:</strong> registros de acceso, dirección IP, tipo de navegador y páginas visitadas dentro de la plataforma.</li>
            <li><strong>Datos de integración:</strong> tokens de la API de WhatsApp Business (Meta Cloud API) necesarios para operar el bot.</li>
          </ul>

          <h2>2. Cómo usamos tu información</h2>
          <ul>
            <li>Operar y mejorar la plataforma Prospekto.</li>
            <li>Procesar y entregar los mensajes de WhatsApp mediante el bot de IA.</li>
            <li>Asignar leads a los vendedores de tu equipo.</li>
            <li>Enviarte notificaciones sobre actividad relevante (nuevos leads, reportes).</li>
            <li>Brindarte soporte técnico y atención al cliente.</li>
            <li>Cumplir con obligaciones legales aplicables en México.</li>
          </ul>

          <h2>3. Uso de inteligencia artificial</h2>
          <p>
            Prospekto utiliza modelos de lenguaje de terceros (OpenAI) para procesar las conversaciones de WhatsApp.
            Los mensajes de los prospectos se envían a la API de OpenAI de forma cifrada para generar respuestas
            automáticas. No utilizamos estos datos para entrenar modelos externos.
          </p>

          <h2>4. Compartición de datos</h2>
          <p>No vendemos ni alquilamos tu información personal. Podemos compartir datos únicamente con:</p>
          <ul>
            <li><strong>Proveedores de servicio:</strong> OpenAI (procesamiento de IA), Meta (API de WhatsApp Business), Supabase (base de datos), Vercel (hospedaje).</li>
            <li><strong>Autoridades competentes:</strong> cuando la ley mexicana lo exija.</li>
          </ul>
          <p>Todos nuestros proveedores están sujetos a acuerdos de protección de datos.</p>

          <h2>5. Almacenamiento y seguridad</h2>
          <p>
            Tus datos se almacenan en servidores seguros con cifrado en tránsito (TLS) y en reposo. Implementamos
            controles de acceso y auditorías periódicas. Sin embargo, ningún sistema es 100% infalible y no podemos
            garantizar seguridad absoluta.
          </p>

          <h2>6. Retención de datos</h2>
          <p>
            Conservamos tus datos mientras tu cuenta esté activa. Al cancelar tu cuenta, eliminamos o anonimizamos
            tu información dentro de los 30 días siguientes, salvo obligación legal de conservarla por más tiempo.
          </p>

          <h2>7. Tus derechos (ARCO)</h2>
          <p>Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (México), tienes derecho a:</p>
          <ul>
            <li><strong>Acceso:</strong> conocer qué datos tenemos sobre ti.</li>
            <li><strong>Rectificación:</strong> corregir datos inexactos.</li>
            <li><strong>Cancelación:</strong> solicitar la eliminación de tus datos.</li>
            <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos.</li>
          </ul>
          <p>
            Para ejercer tus derechos, escríbenos a{" "}
            <a href="mailto:hola@prospekto.mx">hola@prospekto.mx</a> o visita nuestra{" "}
            <Link href="/eliminacion-datos">página de eliminación de datos</Link>.
          </p>

          <h2>8. Cookies</h2>
          <p>
            Utilizamos cookies de sesión esenciales para el funcionamiento de la plataforma. No utilizamos cookies
            de seguimiento publicitario de terceros.
          </p>

          <h2>9. Menores de edad</h2>
          <p>
            Prospekto es un servicio dirigido a empresas y no está destinado a menores de 18 años. No recopilamos
            datos de menores de forma intencionada.
          </p>

          <h2>10. Cambios a esta política</h2>
          <p>
            Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos por correo electrónico
            o mediante un aviso en la plataforma ante cambios sustanciales. El uso continuado del servicio después
            de la notificación implica tu aceptación.
          </p>

          <h2>11. Contacto</h2>
          <p>
            ¿Tienes preguntas sobre esta política? Escríbenos a{" "}
            <a href="mailto:hola@prospekto.mx">hola@prospekto.mx</a>.
          </p>
        </div>
      </div>

      {/* Footer mínimo */}
      <footer style={{ borderTop: "1px solid rgba(0,0,0,0.07)", padding: "28px 24px", textAlign: "center", background: "rgba(255,255,255,0.4)" }}>
        <div style={{ fontSize: 13, color: "#9ca3af", display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "#9ca3af", textDecoration: "none" }}>Inicio</Link>
          <Link href="/condiciones" style={{ color: "#9ca3af", textDecoration: "none" }}>Condiciones del Servicio</Link>
          <Link href="/privacidad" style={{ color: "#00a884", textDecoration: "none" }}>Política de Privacidad</Link>
          <Link href="/eliminacion-datos" style={{ color: "#9ca3af", textDecoration: "none" }}>Eliminación de Datos</Link>
        </div>
      </footer>
    </main>
  );
}
