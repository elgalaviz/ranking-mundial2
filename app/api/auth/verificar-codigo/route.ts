import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "ranking-mundial-26-secret-key-change-in-production"
);

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json({ error: "Datos incompletos." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: user, error } = await supabase
      .from("users")
      .select("id, phone, otp_code, otp_expires_at")
      .eq("phone", phone)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }

    if (user.otp_code !== code) {
      return NextResponse.json({ error: "Código incorrecto." }, { status: 401 });
    }

    if (!user.otp_expires_at || new Date(user.otp_expires_at) < new Date()) {
      return NextResponse.json({ error: "El código ha expirado. Solicita uno nuevo." }, { status: 401 });
    }

    await supabase
      .from("users")
      .update({ otp_code: null, otp_expires_at: null })
      .eq("id", user.id);

    const token = await new SignJWT({ userId: user.id, phone: user.phone })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .setIssuedAt()
      .sign(JWT_SECRET);

    const response = NextResponse.json({ success: true });
    response.cookies.set("quiniela_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;

  } catch (error: any) {
    console.error("Error verificando código:", error);
    return NextResponse.json({ error: "Error interno. Intenta de nuevo." }, { status: 500 });
  }
}
