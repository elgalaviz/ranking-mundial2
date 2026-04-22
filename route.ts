import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppText } from "@/lib/ai/sendWhatsAppText";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const phone = url.searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "Falta el parámetro 'phone'. Ejemplo: ?phone=5218112345678" }, { status: 400 });
  }

  // 1. Obtener configuración de WhatsApp de variables de entorno
  const accessToken = process.env.WHATSAPP_TOKEN || "";
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";

  if (!accessToken || !phoneNumberId) {
    return NextResponse.json({ error: "Faltan configurar variables de entorno (WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID)." }, { status: 500 });
  }

  // 2. Construir el mensaje de alerta
  const mensajePrueba = "🚨 *ALERTA DE PARTIDO (PRUEBA)* 🚨\n\n¡Hola! Esta es una prueba del sistema de alertas automáticas de Ranking Mundial 26. ⚽🏆";

  // 3. Enviar el mensaje usando tu función existente
  try {
    const resultado = await sendWhatsAppText({
      accessToken: accessToken,
      phoneNumberId: phoneNumberId,
      to: phone,
      body: mensajePrueba,
    });

    if (resultado.ok) {
      return NextResponse.json({ success: true, message: `Alerta enviada a ${phone}` });
    } else {
      return NextResponse.json({ success: false, error: resultado.error }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}