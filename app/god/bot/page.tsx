import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/ai/systemPrompt";
import { Bot, Save } from "lucide-react";

const GOD_EMAIL = process.env.ADMIN_EMAIL || "rene.galaviz@gmail.com";

function getSupabaseAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function savePrompt(formData: FormData) {
  "use server";
  const prompt = formData.get("prompt") as string;
  if (!prompt?.trim()) return;
  const db = getSupabaseAdmin();
  await db.from("bot_config").upsert({ id: "singleton", prompt: prompt.trim(), updated_at: new Date().toISOString() });
  revalidatePath("/god/bot");
}

async function resetPrompt() {
  "use server";
  const db = getSupabaseAdmin();
  await db.from("bot_config").delete().eq("id", "singleton");
  revalidatePath("/god/bot");
}

export default async function BotConfigPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.email !== GOD_EMAIL) redirect("/god/dashboard");

  const db = getSupabaseAdmin();
  const { data: config } = await db
    .from("bot_config")
    .select("prompt, updated_at")
    .eq("id", "singleton")
    .maybeSingle();

  const currentPrompt = config?.prompt ?? DEFAULT_SYSTEM_PROMPT;
  const isCustom = !!config?.prompt;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Bot className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Reglas del Bot</h1>
            <p className="text-sm text-gray-500">
              {isCustom
                ? `Versión personalizada · Guardada ${new Date(config!.updated_at).toLocaleString("es-MX", { timeZone: "America/Mexico_City", dateStyle: "short", timeStyle: "short" })}`
                : "Usando el prompt por defecto del código"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Variable disponible:</strong> escribe <code className="bg-amber-100 px-1 rounded">{"{{nombre}}"}</code> donde quieras que aparezca el nombre del usuario.
      </div>

      <form action={savePrompt} className="space-y-4">
        <textarea
          name="prompt"
          defaultValue={currentPrompt}
          rows={40}
          className="w-full font-mono text-sm bg-white border border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#006847] resize-y"
          spellCheck={false}
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-[#006847] hover:bg-[#005538] text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
          >
            <Save className="w-4 h-4" />
            Guardar y activar
          </button>
          {isCustom && (
            <form action={resetPrompt}>
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-red-600 underline transition-colors"
              >
                Restaurar versión original
              </button>
            </form>
          )}
        </div>
      </form>
    </div>
  );
}
