import { createClient } from '@supabase/supabase-js';
import { ChatCompletionTool } from 'openai/resources/chat/completions';
import { getWorldCupOdds, findEventByTeam } from '@/lib/odds/client';

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
    let query = supabase.from('partidos').select('equipo_local, equipo_visitante, fecha_utc, estadio, ciudad, fase, grupo, goles_local, goles_visitante').limit(20);

    if (equipo) {
      // Busca partidos donde el equipo es local O visitante
      query = query.or(`equipo_local.ilike.%${equipo}%,equipo_visitante.ilike.%${equipo}%`);
    }
    
    // Ordena por fecha para mostrar los próximos primero
    query = query.order('fecha_utc', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error("Error al consultar partidos:", error);
      return JSON.stringify({ error: "Error al consultar la base de datos." });
    }

    if (!data || data.length === 0) {
      return JSON.stringify({ message: `No se encontraron partidos para '${equipo || 'los equipos solicitados'}'.` });
    }
    
    const now = new Date();
    const nowCDMX = now.toLocaleString('es-MX', {
      timeZone: 'America/Mexico_City',
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    // Formateamos la fecha para que sea más legible para la IA
    const formattedData = data.map(partido => {
      const fechaPartido = new Date(partido.fecha_utc);
      const jugado = partido.goles_local !== null && partido.goles_visitante !== null;
      const hoy = fechaPartido.toDateString() === now.toDateString();
      const estado = jugado ? 'Jugado' : hoy ? 'Hoy' : fechaPartido < now ? 'Jugado (sin resultado)' : 'Próximo';
      return {
        equipo_local: partido.equipo_local,
        equipo_visitante: partido.equipo_visitante,
        fecha: fechaPartido.toLocaleString('es-MX', {
          timeZone: 'America/Mexico_City',
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }) + ' (Hora CDMX)',
        estadio: partido.estadio || null,
        ciudad: partido.ciudad || null,
        fase: partido.fase || null,
        grupo: partido.grupo || null,
        estado,
        resultado: jugado ? `${partido.goles_local}-${partido.goles_visitante}` : null,
      };
    });

    return JSON.stringify({ ahora_cdmx: nowCDMX, partidos: formattedData });
  } catch (e) {
    console.error("Excepción en getPartidos:", e);
    return JSON.stringify({ error: "Ocurrió una excepción al procesar la solicitud de partidos." });
  }
}

// --- getMomios ---
export async function getMomios(equipo?: string) {
  console.log(`🛠️ Ejecutando herramienta 'getMomios' para: ${equipo || "todos"}`);
  try {
    const events = await getWorldCupOdds();

    if (!events || events.length === 0) {
      return JSON.stringify({ message: "No hay momios disponibles en este momento." });
    }

    const targets = equipo ? [findEventByTeam(events, equipo)].filter(Boolean) : events.slice(0, 8);

    if (equipo && targets.length === 0) {
      return JSON.stringify({ message: `No se encontraron momios para '${equipo}'. Puede que el partido aún no tenga línea.` });
    }

    const resultado = (targets as typeof events).map((e) => {
      // Tomar la casa con más mercados, o la primera
      const bookmaker = e.bookmakers[0];
      const h2h = bookmaker?.markets.find((m) => m.key === "h2h");
      const outcomes = h2h?.outcomes ?? [];

      return {
        partido: `${e.home_team} vs ${e.away_team}`,
        fecha: new Date(e.commence_time).toLocaleString("es-MX", {
          timeZone: "America/Mexico_City",
          weekday: "long", month: "long", day: "numeric",
          hour: "2-digit", minute: "2-digit",
        }) + " (Hora CDMX)",
        casa_apuestas: bookmaker?.title ?? "N/A",
        momios: outcomes.map((o) => ({
          resultado: o.name,
          paga: o.price.toFixed(2),
        })),
        casas_disponibles: e.bookmakers.length,
      };
    });

    return JSON.stringify(resultado);
  } catch (e) {
    console.error("Excepción en getMomios:", e);
    return JSON.stringify({ error: "No se pudieron obtener los momios en este momento." });
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
  {
    type: 'function',
    function: {
      name: 'getMomios',
      description: 'Obtiene los momios/cuotas de apuestas de partidos del Mundial 2026 desde casas de apuestas reales. Úsala cuando el usuario pregunte por momios, cuotas, qué pagan, favoritos o apuestas de algún partido.',
      parameters: {
        type: 'object',
        properties: {
          equipo: {
            type: 'string',
            description: 'Nombre del equipo para filtrar (ej. "Mexico", "Argentina"). Si se omite, devuelve los próximos partidos con momios.',
          },
        },
        required: [],
      },
    },
  },
];
