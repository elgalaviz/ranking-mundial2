import { createClient } from "@supabase/supabase-js";
import { Shirt } from "lucide-react";
import JugadoresEditor from "./JugadoresEditor";
import SyncButtons from "./SyncButtons";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function GodJugadoresPage() {
  const supabase = getSupabase();

  const [{ data: selecciones }, { data: jugadores }] = await Promise.all([
    supabase.from("selecciones").select("id, nombre, logo_url").order("nombre"),
    supabase.from("jugadores").select("id, team_id, nombre, posicion, numero, edad, foto_url, foto_custom_url").order("nombre").limit(2000),
  ]);

  const total = jugadores?.length || 0;
  const conCustom = jugadores?.filter(j => j.foto_custom_url).length || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shirt className="w-6 h-6" /> Jugadores
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} jugadores · {conCustom} con foto custom
            </p>
        </div>
        <SyncButtons />
      </div>

      <JugadoresEditor
        selecciones={selecciones || []}
        jugadores={jugadores || []}
      />
    </div>
  );
}
