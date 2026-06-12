import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  revalidatePath(`/jugadores/${id}`);
  return NextResponse.json({ ok: true, revalidated: `/jugadores/${id}` });
}
