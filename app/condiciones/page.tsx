import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Condiciones del Servicio",
  description: "Condiciones del servicio de Prospekto. Lee los términos y condiciones que rigen el uso de nuestra plataforma.",
  alternates: { canonical: "/condiciones" },
};

export default function CondicionesPage() {
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
          Condiciones del Servicio
        </h1>

        <div className="prose">
          <p>
            Bienvenido a <strong>Prospekto</strong>. Al registrarte y usar nuestra plataforma, aceptas las
            presentes Condiciones del Servicio. Si no estás de acuerdo con alguna parte, te pedimos no utilizar
            el servicio.
          </p>

          <h2>1. Descripción del servicio</h2>
          <p>
            Prospekto es una plataforma SaaS que combina un CRM con un bot conversacional de inteligencia
            artificial conectado a WhatsApp Business. Permite a empresas y equipos de ventas capturar,
            calificar y gestionar prospectos de forma automatizada a través de la API oficial de Meta.
          </p>

          <h2>2. Registro y cuenta</h2>
          <ul>
            <li>Debes tener al menos 18 años y actuar en nombre de una empresa o negocio legítimo.</li>
            <li>Eres responsable de mantener la confidencialidad de tus credenciales de acceso.</li>
            <li>Nos reservamos el derecho de suspender cuentas que infrinjan estas condiciones.</li>
            <li>Solo puedes tener una cuenta activa por número de WhatsApp Business.</li>
          </ul>

          <h2>3. Uso aceptable</h2>
          <p>Al usar Prospekto te comprometes a:</p>
          <ul>
            <li>Usar el servicio únicamente para fines comerciales legítimos.</li>
            <li>No enviar spam, contenido engañoso ni comunicaciones no solicitadas.</li>
            <li>Cumplir con las <a href="https://www.whatsapp.com/legal/business-policy" target="_blank" rel="noopener noreferrer">Políticas de WhatsApp Business</a> de Meta en todo momento.</li>
            <li>No utilizar la plataforma para actividades ilegales, fraudulentas o que infrinjan derechos de terceros.</li>
            <li>No intentar acceder a cuentas o datos de otros usuarios.</li>
          </ul>

          <h2>4. Integración con Meta / WhatsApp Business</h2>
          <p>
            Prospekto opera mediante la API oficial de WhatsApp Business (Meta Cloud API). Al conectar tu número,
            aceptas también los Términos de Servicio de Meta para Empresas. Prospekto no es un producto de Meta
            y Meta no respalda ni es responsable de este servicio.
          </p>
          <p>
            Meta puede suspender el acceso a la API en cualquier momento por incumplimiento de sus políticas.
            Prospekto no se hace responsable por suspensiones originadas en violaciones a las políticas de Meta
            por parte del usuario.
          </p>

          <h2>5. Pagos y facturación</h2>
          <ul>
            <li>El servicio se cobra mensualmente conforme al plan contratado.</li>
            <li>Los precios se muestran en MXN e incluyen IVA cuando aplique.</li>
            <li>El precio de lanzamiento ("Early Access") queda bloqueado para cuentas registradas durante el periodo promocional.</li>
            <li>Podemos modificar precios futuros con un aviso mínimo de 30 días.</li>
            <li>No realizamos reembolsos por periodos ya facturados, salvo error imputable a Prospekto.</li>
          </ul>

          <h2>6. Propiedad intelectual</h2>
          <p>
            Todo el código, diseño, marca y contenido de Prospekto son propiedad exclusiva de sus creadores.
            Al usar el servicio no adquieres ningún derecho sobre ellos. Los datos de tu negocio y tus leads
            son de tu propiedad; Prospekto los usa únicamente para prestar el servicio.
          </p>

          <h2>7. Privacidad y datos</h2>
          <p>
            El tratamiento de datos personales se rige por nuestra{" "}
            <Link href="/privacidad">Política de Privacidad</Link>. Al aceptar estas condiciones, aceptas
            también dicha política.
          </p>

          <h2>8. Disponibilidad del servicio</h2>
          <p>
            Nos esforzamos por mantener una disponibilidad del 99 %. Sin embargo, pueden ocurrir interrupciones
            por mantenimiento, fallas técnicas o causas de fuerza mayor. No garantizamos disponibilidad
            ininterrumpida y no seremos responsables por pérdidas derivadas de interrupciones del servicio.
          </p>

          <h2>9. Limitación de responsabilidad</h2>
          <p>
            En la máxima medida permitida por la ley mexicana, Prospekto no será responsable por daños
            indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso del servicio.
            Nuestra responsabilidad total no excederá el importe pagado por el usuario en los últimos 3 meses.
          </p>

          <h2>10. Terminación</h2>
          <p>
            Puedes cancelar tu cuenta en cualquier momento. Prospekto puede terminar o suspender el acceso
            sin previo aviso ante un incumplimiento grave de estas condiciones. Tras la cancelación, tus datos
            se eliminarán conforme a nuestra{" "}
            <Link href="/eliminacion-datos">política de eliminación de datos</Link>.
          </p>

          <h2>11. Cambios a las condiciones</h2>
          <p>
            Podemos actualizar estas condiciones con un aviso de al menos 15 días. El uso continuado del
            servicio después del aviso implica la aceptación de los cambios.
          </p>

          <h2>12. Ley aplicable</h2>
          <p>
            Estas condiciones se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia
            se someterá a los tribunales competentes de la Ciudad de México, renunciando a cualquier otro fuero.
          </p>

          <h2>13. Contacto</h2>
          <p>
            ¿Preguntas sobre estas condiciones? Escríbenos a{" "}
            <a href="mailto:hola@prospekto.mx">hola@prospekto.mx</a>.
          </p>
        </div>
      </div>

      {/* Footer mínimo */}
      <footer style={{ borderTop: "1px solid rgba(0,0,0,0.07)", padding: "28px 24px", textAlign: "center", background: "rgba(255,255,255,0.4)" }}>
        <div style={{ fontSize: 13, color: "#9ca3af", display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "#9ca3af", textDecoration: "none" }}>Inicio</Link>
          <Link href="/condiciones" style={{ color: "#00a884", textDecoration: "none" }}>Condiciones del Servicio</Link>
          <Link href="/privacidad" style={{ color: "#9ca3af", textDecoration: "none" }}>Política de Privacidad</Link>
          <Link href="/eliminacion-datos" style={{ color: "#9ca3af", textDecoration: "none" }}>Eliminación de Datos</Link>
        </div>
      </footer>
    </main>
  );
}
