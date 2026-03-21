"use server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function saveLeadNotes(formData: FormData) {
  const telefono = String(formData.get("telefono") || "").trim();
  const notas = String(formData.get("notas") || "").trim();

  if (!telefono) {
    throw new Error("Teléfono no válido.");
  }

  const { error } = await supabase
    .from("contactos")
    .update({ notas })
    .eq("whatsapp", telefono);

  if (error) {
    console.error("Error actualizando notas:", error.message);
    throw new Error("No se pudo actualizar la nota.");
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${telefono}`);
}