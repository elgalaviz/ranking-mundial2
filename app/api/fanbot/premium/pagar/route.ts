import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const PREMIUM_PRICE = 99;

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  const { phone } = await req.json();
  if (!phone) return NextResponse.json({ error: "phone requerido." }, { status: 400 });

  const preference = new Preference(mp);
  const response = await preference.create({
    body: {
      items: [
        {
          id: `premium-${phone}`,
          title: "FanBot Premium — Mundial 2026",
          description: "Consultas ilimitadas durante todo el torneo",
          quantity: 1,
          unit_price: PREMIUM_PRICE,
          currency_id: "MXN",
        },
      ],
      back_urls: {
        success: `${APP_URL}/fanbot/premium/exito?phone=${encodeURIComponent(phone)}`,
        failure: `${APP_URL}/fanbot/premium?phone=${encodeURIComponent(phone)}&error=1`,
        pending: `${APP_URL}/fanbot/premium/exito?phone=${encodeURIComponent(phone)}&pendiente=1`,
      },
      auto_return: "approved",
      notification_url: `${APP_URL}/api/webhooks/mercadopago`,
      external_reference: `premium:${phone}`,
    },
  });

  const isTest = process.env.MP_SANDBOX === "true";
  const checkout_url = isTest ? response.sandbox_init_point : response.init_point;
  return NextResponse.json({ checkout_url });
}
