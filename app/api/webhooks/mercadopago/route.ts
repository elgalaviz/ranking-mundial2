import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
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

function validateSignature(req: NextRequest, rawBody: string, dataId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return false;

  const xSignature = req.headers.get("x-signature") ?? "";
  const xRequestId = req.headers.get("x-request-id") ?? "";

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => p.trim().split("=") as [string, string])
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  return expected === v1;
}

async function handleLigaPago(ligaId: string) {
  const supabase = getSupabase();

  const { data: liga } = await supabase
    .from("ligas")
    .select("id, nombre, codigo, estado, owner_phone, owner_nombre")
    .eq("id", ligaId)
    .single();

  if (!liga || liga.estado === "activa") return;

  await supabase.from("ligas").update({ estado: "activa" }).eq("id", ligaId);

  const altPhone =
    liga.owner_phone?.startsWith("52") && !liga.owner_phone?.startsWith("521")
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
}

async function handlePremiumPago(phone: string) {
  const supabase = getSupabase();

  const altPhone =
    phone.startsWith("52") && !phone.startsWith("521")
      ? phone.replace(/^52/, "521")
      : phone.replace(/^521/, "52");

  await supabase
    .from("users")
    .update({ plan: "premium" })
    .in("phone", [phone, altPhone]);

  await sendWhatsAppText({
    accessToken: WHATSAPP_TOKEN,
    phoneNumberId: PHONE_NUMBER_ID,
    to: phone,
    body:
      `⭐ *¡Ya eres FanBot Premium!*\n\n` +
      `Ahora puedes hacer consultas ilimitadas durante todo el Mundial 2026.\n\n` +
      `Escríbeme cuando quieras. ¡Que empiece el fútbol! 🏆`,
  });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    if (body.type !== "payment") {
      return new NextResponse("ok", { status: 200 });
    }

    const paymentId = body.data?.id;
    if (!paymentId) return new NextResponse("ok", { status: 200 });

    if (!validateSignature(req, rawBody, String(paymentId))) {
      return new NextResponse("unauthorized", { status: 401 });
    }

    const payment = new Payment(mp);
    const paymentData = await payment.get({ id: paymentId });

    if (paymentData.status !== "approved") {
      return new NextResponse("ok", { status: 200 });
    }

    const externalRef = paymentData.external_reference ?? "";

    if (externalRef.startsWith("premium:")) {
      const phone = externalRef.replace("premium:", "");
      await handlePremiumPago(phone);
    } else {
      await handleLigaPago(externalRef);
    }

    return new NextResponse("ok", { status: 200 });
  } catch (err) {
    console.error("Error webhook MP:", err);
    return new NextResponse("error", { status: 500 });
  }
}
