import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import sharp from "sharp";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const BUCKET = "jugadores";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const auth = await createServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("foto") as File | null;
  const jugadorId = formData.get("jugador_id") as string | null;

  if (!file || !jugadorId) {
    return NextResponse.json({ error: "Faltan campos." }, { status: 400 });
  }

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido. Solo JPG, PNG o WebP." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "La imagen no puede superar 5 MB." }, { status: 400 });
  }

  const supabase = getSupabase();
  const path = `${jugadorId}.webp`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const optimized = await sharp(buffer)
    .resize(400, 600, { fit: "cover", position: "top" })
    .webp({ quality: 82 })
    .toBuffer();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, optimized, { upsert: true, contentType: "image/webp" });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("jugadores")
    .update({ foto_custom_url: publicUrl })
    .eq("id", jugadorId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: publicUrl });
}

export async function DELETE(req: NextRequest) {
  const auth = await createServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jugador_id } = await req.json();
  if (!jugador_id) return NextResponse.json({ error: "Falta jugador_id." }, { status: 400 });

  const supabase = getSupabase();

  const { error } = await supabase
    .from("jugadores")
    .update({ foto_custom_url: null })
    .eq("id", jugador_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
