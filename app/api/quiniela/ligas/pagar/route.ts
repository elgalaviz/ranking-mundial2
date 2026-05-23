import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { jwtVerify } from "jose";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET env var is required");
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

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
  const token = req.cookies.get("quiniela_session")?.value;
  if (!token) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  let phone: string;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    phone = (payload as { phone: string }).phone;
  } catch {
    return NextResponse.json({ error: "Sesión inválida." }, { status: 401 });
  }

  const { liga_id } = await req.json();
  if (!liga_id) return NextResponse.json({ error: "liga_id requerido." }, { status: 400 });

  const supabase = getSupabase();
  const { data: liga, error } = await supabase
    .from("ligas")
    .select("id, nombre, tier, owner_phone")
    .eq("id", liga_id)
    .single();

  if (error || !liga) return NextResponse.json({ error: "Liga no encontrada." }, { status: 404 });
  if (liga.owner_phone !== phone) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const preference = new Preference(mp);
  const response = await preference.create({
    body: {
      items: [
        {
          id: liga.id,
          title: `Liga Quiniela Mundial 2026 — ${liga.nombre}`,
          quantity: 1,
          unit_price: liga.tier,
          currency_id: "MXN",
        },
      ],
      back_urls: {
        success: `${APP_URL}/quiniela/ligas/pago-exitoso?liga=${liga.id}`,
        failure: `${APP_URL}/quiniela/ligas/nueva`,
        pending: `${APP_URL}/quiniela/ligas/pago-exitoso?liga=${liga.id}&pendiente=1`,
      },
      auto_return: "approved",
      notification_url: `${APP_URL}/api/webhooks/mercadopago`,
      external_reference: liga.id,
    },
  });

  const isTest = process.env.MP_SANDBOX === "true";
  const checkout_url = isTest ? response.sandbox_init_point : response.init_point;
  return NextResponse.json({ checkout_url });
}
