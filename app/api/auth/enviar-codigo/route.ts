import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppText } from "@/lib/ai/sendWhatsAppText";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { error: "Número de teléfono inválido." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // México: WhatsApp a veces guarda 521XXXXXXXXXX en vez de 52XXXXXXXXXX
    const altPhone = phone.startsWith("52") && !phone.startsWith("521")
      ? phone.replace(/^52/, "521")
      : phone.replace(/^521/, "52");

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, phone")
      .in("phone", [phone, altPhone])
      .limit(1)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Este número no está registrado. Por favor, envía 'Hola' a nuestro bot de WhatsApp primero." },
        { status: 404 }
      );
    }

    const otp_code = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from("users")
      .update({ otp_code, otp_expires_at })
      .eq("id", user.id);

    if (updateError) throw updateError;

    await sendWhatsAppText({
      accessToken: WHATSAPP_TOKEN,
      phoneNumberId: PHONE_NUMBER_ID,
      to: user.phone!,
      body: `⚽ Tu código de acceso para la Quiniela de Ranking Mundial 26 es: *${otp_code}*\n\nEste código expira en 10 minutos.`,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Error al enviar código OTP:", error);
    return NextResponse.json({ error: "No se pudo enviar el código. Intenta de nuevo." }, { status: 500 });
  }
}
