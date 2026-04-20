import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { sendWhatsAppText } from "@/lib/ai/sendWhatsAppText";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.type !== "payment") {
      return new NextResponse("ok", { status: 200 });
    }

    const paymentId = body.data?.id;
    if (!paymentId) return new NextResponse("ok", { status: 200 });

    const payment = new Payment(mp);
    const paymentData = await payment.get({ id: paymentId });

    if (paymentData.status !== "approved") {
      return new NextResponse("ok", { status: 200 });
    }

    const ligaId = paymentData.external_reference;
    if (!ligaId) return new NextResponse("ok", { status: 200 });

    const supabase = getSupabase();

    const { data: liga } = await supabase
      .from("ligas")
      .select("id, nombre, codigo, estado, owner_phone, owner_nombre")
      .eq("id", ligaId)
      .single();

    if (!liga || liga.estado === "activa") {
      return new NextResponse("ok", { status: 200 });
    }

    await supabase
      .from("ligas")
      .update({ estado: "activa" })
      .eq("id", ligaId);

    // Auto-unir al dueño
    const altPhone = liga.owner_phone?.startsWith("52") && !liga.owner_phone?.startsWith("521")
      ? liga.owner_phone.replace(/^52/, "521")
      : liga.owner_phone?.replace(/^521/, "52");

    const { data: ownerUser } = await supabase
      .from("users")
      .select("id")
      .in("phone", [liga.owner_phone, altPhone].filter(Boolean))
      .limit(1)
      .single();

    if (ownerUser) {
      try {
        await supabase.from("liga_miembros").insert({ liga_id: ligaId, user_id: ownerUser.id });
      } catch { /* ignorar duplicado */ }
    }

    if (liga.owner_phone) {
      await sendWhatsAppText({
        accessToken: WHATSAPP_TOKEN,
        phoneNumberId: PHONE_NUMBER_ID,
        to: liga.owner_phone,
        body:
          `✅ *¡Pago confirmado!*\n\n` +
          `Tu liga *"${liga.nombre}"* está activa.\n\n` +
          `Comparte este enlace con tus participantes:\n` +
          `${APP_URL}/quiniela/unirse/${liga.codigo}\n\n` +
          `Código: *${liga.codigo}* 🏆`,
      });
    }

    return new NextResponse("ok", { status: 200 });
  } catch (err) {
    console.error("Error webhook MP:", err);
    return new NextResponse("error", { status: 500 });
  }
}
