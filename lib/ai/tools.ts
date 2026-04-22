import { createClient } from '@supabase/supabase-js';
import { ChatCompletionTool } from 'openai/resources/chat/completions';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// --- Función que ejecuta la herramienta ---
export async function getPartidos(equipo?: string) {
  console.log(`🛠️ Ejecutando herramienta 'getPartidos' para el equipo: ${equipo || "todos"}`);
  const supabase = getSupabase();
  try {
    let query = supabase.from('partidos').select('equipo_local, equipo_visitante, fecha, estadio').limit(10);

    if (equipo) {
      // Busca partidos donde el equipo es local O visitante
      query = query.or(`equipo_local.ilike.%${equipo}%,equipo_visitante.ilike.%${equipo}%`);
    }
    
    // Ordena por fecha para mostrar los próximos primero
    query = query.order('fecha', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error("Error al consultar partidos:", error);
      return JSON.stringify({ error: "Error al consultar la base de datos." });
    }

    if (!data || data.length === 0) {
      return JSON.stringify({ message: `No se encontraron partidos para '${equipo || 'los equipos solicitados'}'.` });
    }
    
    // Formateamos la fecha para que sea más legible para la IA
    const formattedData = data.map(partido => ({
      ...partido,
      fecha: new Date(partido.fecha).toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City',
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }) + ' (Hora CDMX)'
    }));

    return JSON.stringify(formattedData);
  } catch (e) {
    console.error("Excepción en getPartidos:", e);
    return JSON.stringify({ error: "Ocurrió una excepción al procesar la solicitud de partidos." });
  }
}

// --- Definición de la herramienta para OpenAI ---
export const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'getPartidos',
      description: 'Obtiene información sobre los partidos del mundial de la base de datos. Se puede filtrar por un equipo específico.',
      parameters: {
        type: 'object',
        properties: {
          equipo: {
            type: 'string',
            description: 'El nombre del equipo a buscar (ej. "México", "Argentina"). Si se omite, devuelve los próximos partidos generales.',
          },
        },
        required: [],
      },
    },
  },
];
