import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Eliminación de Datos",
  description: "Solicita la eliminación de tus datos personales en Prospekto. Conoce el proceso y tus derechos.",
  alternates: { canonical: "/eliminacion-datos" },
};

export default function EliminacionDatosPage() {
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
        .prose p, .prose li { font-size: 15px; color: #4b5563; line-height: 1.8; margin-bottom: 12px; }
        .prose ul { padding-left: 20px; }
        .prose li { list-style: disc; }
        .prose a { color: #00a884; text-decoration: underline; }
        .step-box {
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 16px;
          padding: 20px 24px;
          backdrop-filter: blur(8px);
          margin-bottom: 12px;
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .step-num {
          background: #00a884;
          color: #fff;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 2px;
        }
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
        <h1 className="serif" style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 400, lineHeight: 1.15, marginBottom: 16, color: "#1a2035" }}>
          Eliminación de Datos
        </h1>
        <p style={{ fontSize: 16, color: "#6b7280", marginBottom: 40, lineHeight: 1.7 }}>
          En Prospekto respetamos tu derecho a la cancelación de datos conforme a la Ley Federal de Protección de
          Datos Personales en Posesión de los Particulares (México) y las políticas de la plataforma Meta.
          Puedes solicitar la eliminación de tu información en cualquier momento.
        </p>

        {/* Qué se elimina */}
        <div style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)", borderRadius: 20, padding: "28px 28px", backdropFilter: "blur(12px)", marginBottom: 40 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1a2035", marginBottom: 16, marginTop: 0 }}>¿Qué datos se eliminan?</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: "👤", text: "Datos de tu cuenta: nombre, correo y teléfono" },
              { icon: "💬", text: "Historial de conversaciones y leads capturados" },
              { icon: "🏢", text: "Configuración de tu negocio y catálogo de productos" },
              { icon: "🔑", text: "Tokens y credenciales de WhatsApp Business asociados" },
              { icon: "📊", text: "Registros de uso y actividad dentro de la plataforma" },
            ].map((item) => (
              <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "#374151" }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 16, marginBottom: 0 }}>
            * Algunos datos pueden conservarse hasta 30 días adicionales por razones técnicas o legales antes de
            ser eliminados definitivamente.
          </p>
        </div>

        {/* Pasos */}
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a2035", marginBottom: 20 }}>
          ¿Cómo solicitar la eliminación?
        </h2>

        <div className="step-box">
          <div className="step-num">1</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1a2035", marginBottom: 4 }}>Envía tu solicitud por correo</div>
            <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>
              Escríbenos a{" "}
              <a href="mailto:hola@prospekto.mx" style={{ color: "#00a884" }}>hola@prospekto.mx</a>{" "}
              con el asunto <strong>"Solicitud de eliminación de datos"</strong>. Incluye el correo registrado
              en tu cuenta de Prospekto.
            </div>
          </div>
        </div>

        <div className="step-box">
          <div className="step-num">2</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1a2035", marginBottom: 4 }}>Verificación de identidad</div>
            <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>
              Para proteger tu cuenta, te pediremos confirmar tu identidad respondiendo desde el correo registrado
              o mediante un código de verificación.
            </div>
          </div>
        </div>

        <div className="step-box">
          <div className="step-num">3</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1a2035", marginBottom: 4 }}>Procesamiento en 5 días hábiles</div>
            <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>
              Una vez verificada tu solicitud, procesaremos la eliminación en un plazo máximo de 5 días hábiles.
              Recibirás una confirmación por correo cuando esté completa.
            </div>
          </div>
        </div>

        <div className="step-box">
          <div className="step-num">4</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1a2035", marginBottom: 4 }}>Eliminación definitiva en 30 días</div>
            <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>
              Tus datos serán eliminados permanentemente de nuestros sistemas y los de nuestros proveedores
              dentro de los 30 días siguientes a la confirmación.
            </div>
          </div>
        </div>

        {/* CTA correo */}
        <div style={{ background: "rgba(0,168,132,0.08)", border: "1.5px solid rgba(0,168,132,0.25)", borderRadius: 16, padding: "28px", textAlign: "center", marginTop: 40 }}>
          <div style={{ fontSize: 22, marginBottom: 10 }}>✉️</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#1a2035", marginBottom: 8 }}>
            Solicitar eliminación de datos
          </div>
          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 20 }}>
            Envíanos un correo y procesamos tu solicitud en menos de 5 días hábiles.
          </div>
          <a
            href="mailto:hola@prospekto.mx?subject=Solicitud%20de%20eliminaci%C3%B3n%20de%20datos"
            style={{
              display: "inline-block",
              background: "#00a884",
              color: "#fff",
              borderRadius: 12,
              padding: "12px 28px",
              fontSize: 15,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Enviar solicitud →
          </a>
          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 12 }}>hola@prospekto.mx</div>
        </div>

        <div className="prose" style={{ marginTop: 40 }}>
          <p>
            Para más información sobre cómo tratamos tus datos, consulta nuestra{" "}
            <Link href="/privacidad">Política de Privacidad</Link>.
          </p>
        </div>
      </div>

      {/* Footer mínimo */}
      <footer style={{ borderTop: "1px solid rgba(0,0,0,0.07)", padding: "28px 24px", textAlign: "center", background: "rgba(255,255,255,0.4)" }}>
        <div style={{ fontSize: 13, color: "#9ca3af", display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "#9ca3af", textDecoration: "none" }}>Inicio</Link>
          <Link href="/condiciones" style={{ color: "#9ca3af", textDecoration: "none" }}>Condiciones del Servicio</Link>
          <Link href="/privacidad" style={{ color: "#9ca3af", textDecoration: "none" }}>Política de Privacidad</Link>
          <Link href="/eliminacion-datos" style={{ color: "#00a884", textDecoration: "none" }}>Eliminación de Datos</Link>
        </div>
      </footer>
    </main>
  );
}
