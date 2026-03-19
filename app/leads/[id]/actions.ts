"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveLeadNotes(formData: FormData) {
  const telefono = String(formData.get("telefono") || "").trim();
  const notas = String(formData.get("notas") || "").trim();

  if (!telefono) {
    throw new Error("Teléfono no válido.");
  }

  const { error } = await supabaseServer
    .from("contactos")
    .update({ notas })
    .eq("whatsapp", telefono);

  if (error) {
    console.error("Error actualizando notas:", error.message);
    throw new Error("No se pudo actualizar la nota.");
  }

  // refresca vistas
  revalidatePath("/leads");
  revalidatePath(`/leads/${telefono}`);
}