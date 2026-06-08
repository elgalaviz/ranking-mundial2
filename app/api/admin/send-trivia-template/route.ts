import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { sendWhatsAppTemplate } from "@/lib/ai/sendWhatsAppInteractive";
import fs from "fs";
import path from "path";

const TEMPLATE_NAME = process.env.TRIVIA_TEMPLATE_NAME || "trivia_pregame";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const GOD_EMAIL = process.env.ADMIN_EMAIL!;

type TriviaItem = { id: number; pregunta: string; opciones: string[]; respuesta: string; dato: string };

function loadTrivia(): TriviaItem[] {
  const raw = fs.readFileSync(path.join(process.cwd(), "data", "trivia_mexico.json"), "utf-8");
  return JSON.parse(raw) as TriviaItem[];
}

function getAdminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== GOD_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getAdminDb();

  // Obtener todos los usuarios con número de teléfono
  const { data: users, error } = await db
    .from("users")
    .select("id, whatsapp_id, phone")
    .not("phone", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!users || users.length === 0) {
    return NextResponse.json({ sent: 0, message: "No hay usuarios registrados" });
  }

  const list = loadTrivia();
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const user of users) {
    // Elegir trivia no vista por este usuario
    const { data: seen } = await db.from("trivia_historial").select("trivia_id").eq("user_id", user.id);
    const seenIds = new Set((seen || []).map((r: { trivia_id: number }) => r.trivia_id));
    const pool = list.filter(t => !seenIds.has(t.id));
    const source = pool.length > 0 ? pool : list;
    const trivia = source[Math.floor(Math.random() * source.length)];
    const [opA, opB, opC] = trivia.opciones;

    const phone = user.phone.startsWith("+") ? user.phone.slice(1) : user.phone;

    // Guardar qué trivia se envió a este usuario
    await db.from("users").update({ trivia_activa_id: trivia.id }).eq("id", user.id);

    const result = await sendWhatsAppTemplate({
      accessToken: WHATSAPP_TOKEN,
      phoneNumberId: PHONE_NUMBER_ID,
      to: phone,
      templateName: TEMPLATE_NAME,
      languageCode: "es_MX",
      bodyParams: [trivia.pregunta, opA, opB, opC],
      buttonPayloads: ["trivia_tpl_A", "trivia_tpl_B", "trivia_tpl_C"],
    });

    if (result.ok) {
      sent++;
    } else {
      failed++;
      errors.push(`${phone}: ${JSON.stringify(result.error)}`);
    }

    // Pequeña pausa para no superar rate limits de Meta
    await new Promise(r => setTimeout(r, 100));
  }

  return NextResponse.json({ sent, failed, total: users.length, errors: errors.slice(0, 10) });
}
