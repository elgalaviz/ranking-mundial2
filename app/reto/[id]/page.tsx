import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function buildWaUrl(local: string, visitante: string) {
  const waNumber = process.env.WA_BOT_NUMBER || "5218112993097";
  const texto = `me retaron y quiero pronosticar el ${local} vs ${visitante}`;
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(texto)}`;
}

export default async function RetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idShort } = await params;

  if (!idShort || idShort.length !== 32) {
    redirect("/");
  }

  const partidoId = [
    idShort.slice(0, 8), idShort.slice(8, 12),
    idShort.slice(12, 16), idShort.slice(16, 20), idShort.slice(20),
  ].join("-");

  const supabase = getSupabase();
  const { data: partido } = await supabase
    .from("partidos")
    .select("equipo_local, equipo_visitante")
    .eq("id", partidoId)
    .single();

  if (!partido) redirect("/");

  const waUrl = buildWaUrl(partido.equipo_local, partido.equipo_visitante);

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Reto MiFanBot · {partido.equipo_local} vs {partido.equipo_visitante}</title>
        {/* Auto-abre WhatsApp en cuanto carga */}
        <meta httpEquiv="refresh" content={`0;url=${waUrl}`} />
      </head>
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f0fdf4", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 360 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a1a", margin: "0 0 8px" }}>
            ¡Te retaron!
          </h1>
          <p style={{ color: "#444", fontSize: 16, margin: "0 0 8px" }}>
            <strong>{partido.equipo_local}</strong> vs <strong>{partido.equipo_visitante}</strong>
          </p>
          <p style={{ color: "#666", fontSize: 14, margin: "0 0 32px" }}>
            Pronostica el partido y demuestra que sabes más ⚽
          </p>
          <a
            href={waUrl}
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "#25D366", color: "#000", fontWeight: 700,
              fontSize: 16, padding: "14px 28px", borderRadius: 16,
              textDecoration: "none", boxShadow: "0 4px 20px rgba(37,211,102,0.3)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Abrir en WhatsApp
          </a>
          <p style={{ color: "#999", fontSize: 12, marginTop: 20 }}>
            MiFanBot · Solo entretenimiento
          </p>
        </div>
      </body>
    </html>
  );
}
