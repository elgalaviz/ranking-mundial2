import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppText } from "@/lib/ai/sendWhatsAppText";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function generarCodigo(): string {
  return Math.random().toString(36).toUpperCase().slice(2, 8);
}

export async function POST(req: NextRequest) {
  const { nombre, tier, owner_nombre, owner_phone } = await req.json();

  if (!nombre || tier === undefined || tier === null || !owner_nombre || !owner_phone) {
    return NextResponse.json({ error: "Todos los campos son requeridos." }, { status: 400 });
  }

  if (tier !== 0 && tier !== 150) {
    return NextResponse.json({ error: "Tier inválido." }, { status: 400 });
  }

  const max_participantes = tier === 0 ? 10 : 50;
  const supabase = getSupabase();

  let codigo = generarCodigo();
  let attempts = 0;
  while (attempts < 5) {
    const { data } = await supabase.from("ligas").select("id").eq("codigo", codigo).single();
    if (!data) break;
    codigo = generarCodigo();
    attempts++;
  }

  const { data, error } = await supabase.from("ligas").insert({
    nombre,
    tier,
    max_participantes,
    codigo,
    estado: tier === 0 ? "activa" : "pendiente",
    owner_nombre,
    owner_phone,
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Buscar el user_id del dueño para auto-unirlo
  const altPhone = owner_phone.startsWith("52") && !owner_phone.startsWith("521")
    ? owner_phone.replace(/^52/, "521")
    : owner_phone.replace(/^521/, "52");

  const { data: ownerUser } = await supabase
    .from("users")
    .select("id")
    .in("phone", [owner_phone, altPhone])
    .limit(1)
    .single();

  if (ownerUser) {
    await supabase.from("liga_miembros").insert({
      liga_id: data.id,
      user_id: ownerUser.id,
    }).throwOnError().catch(() => null);
  }

  if (tier === 0 && owner_phone) {
    try {
      await sendWhatsAppText({
        accessToken: WHATSAPP_TOKEN,
        phoneNumberId: PHONE_NUMBER_ID,
        to: owner_phone,
        body:
          `✅ *¡Tu liga está lista!*\n\n` +
          `Liga: *"${nombre}"*\n\n` +
          `Comparte este enlace con tus participantes:\n` +
          `${APP_URL}/quiniela/unirse/${data.codigo}\n\n` +
          `Código: *${data.codigo}* 🏆`,
      });
    } catch (e) {
      console.error("Error enviando WhatsApp liga gratis:", e);
    }
  }

  return NextResponse.json({ success: true, liga: data });
}
