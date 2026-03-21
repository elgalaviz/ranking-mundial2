import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ESTADOS_VALIDOS = [
  "interesado",
  "llamar",
  "contactado",
  "cliente",
  "perdido",
];

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const body = await req.json();
    const id = body?.id;
    const estado = body?.estado;

    if (!id || !estado) {
      return NextResponse.json(
        { error: "Faltan datos: id o estado" },
        { status: 400 }
      );
    }

    if (!ESTADOS_VALIDOS.includes(estado)) {
      return NextResponse.json(
        { error: "Estado no válido" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("contactos")
      .update({ estado })
      .eq("id", id);

   if (updateError) {
  return NextResponse.json(
    { error: `Error actualizando estado: ${updateError.message}` },
    { status: 500 }
  );
}

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API update-status error:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}