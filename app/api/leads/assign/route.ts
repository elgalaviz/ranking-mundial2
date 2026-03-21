import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const leadId = body?.leadId as string | undefined;
    const assignedUserId = body?.assignedUserId as string | null | undefined;

    if (!leadId) {
      return NextResponse.json(
        { error: "Falta leadId" },
        { status: 400 }
      );
    }

    const { data: businessUser, error: businessUserError } = await supabase
      .from("business_users")
      .select("business_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (businessUserError || !businessUser?.business_id) {
      return NextResponse.json(
        { error: "No se encontró negocio para este usuario" },
        { status: 403 }
      );
    }

    if (businessUser.role !== "admin") {
      return NextResponse.json(
        { error: "Solo admin puede asignar leads" },
        { status: 403 }
      );
    }

    const businessId = businessUser.business_id;

    const { data: lead, error: leadError } = await supabase
      .from("contactos")
      .select("id, business_id")
      .eq("id", leadId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (leadError) {
      return NextResponse.json(
        { error: `Error buscando lead: ${leadError.message}` },
        { status: 500 }
      );
    }

    if (!lead) {
      return NextResponse.json(
        { error: "Lead no encontrado" },
        { status: 404 }
      );
    }

    if (assignedUserId) {
      const { data: targetUser, error: targetUserError } = await supabase
        .from("business_users")
        .select("user_id, business_id")
        .eq("user_id", assignedUserId)
        .eq("business_id", businessId)
        .maybeSingle();

      if (targetUserError) {
        return NextResponse.json(
          { error: `Error validando vendedor: ${targetUserError.message}` },
          { status: 500 }
        );
      }

      if (!targetUser) {
        return NextResponse.json(
          { error: "El usuario asignado no pertenece a este negocio" },
          { status: 400 }
        );
      }
    }

    const { error: updateError } = await supabase
      .from("contactos")
      .update({ assigned_user_id: assignedUserId ?? null })
      .eq("id", leadId);

    if (updateError) {
      return NextResponse.json(
        { error: `Error asignando lead: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API assign lead error:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}