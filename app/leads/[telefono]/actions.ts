"use server";

import { updateLeadNotesByPhone } from "@/lib/googleSheets";
import { revalidatePath } from "next/cache";

export async function saveLeadNotes(formData: FormData) {
  const telefono = String(formData.get("telefono") || "").trim();
  const notas = String(formData.get("notas") || "").trim();

  if (!telefono) {
    throw new Error("Teléfono no válido.");
  }

  const updated = await updateLeadNotesByPhone(telefono, notas);

  if (!updated) {
    throw new Error("No se pudo actualizar la nota.");
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${telefono}`);
}