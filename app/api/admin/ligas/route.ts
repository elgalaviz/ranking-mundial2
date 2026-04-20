import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppText } from "@/lib/ai/sendWhatsAppText";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rankingmundial26.com";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("ligas")
    .select("*, liga_miembros(count)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { id, estado } = await req.json();
  if (!id || !estado) return NextResponse.json({ error: "Faltan campos." }, { status: 400 });

  const supabase = getSupabase();

  const { data: liga, error } = await supabase
    .from("ligas")
    .update({ estado })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notificar al owner por WhatsApp cuando se activa
  if (estado === "activa" && liga.owner_phone) {
    await sendWhatsAppText({
      accessToken: WHATSAPP_TOKEN,
      phoneNumberId: PHONE_NUMBER_ID,
      to: liga.owner_phone,
      body: `⚽ *¡Tu liga "${liga.nombre}" está activa!*\n\nComparte este enlace con tus participantes:\n${APP_URL}/quiniela/unirse/${liga.codigo}\n\nCódigo: *${liga.codigo}*\n\n¡Buena suerte! 🏆`,
    });
  }

  return NextResponse.json({ success: true, liga });
}
