import { createClient } from '@supabase/supabase-js';
import { ChatCompletionTool } from 'openai/resources/chat/completions';
import fs from 'fs';
import path from 'path';

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

// --- buscarHistorial ---
type TipoHistorial = "mundial" | "mexico" | "memorable";

const DATA_FILES: Record<TipoHistorial, string> = {
  mundial: "mundiales.json",
  mexico: "mexico_juegos.json",
  memorable: "partidos_memorables.json",
};

export function buscarHistorial(tipo: TipoHistorial, año?: number): string {
  console.log(`🛠️ buscarHistorial(tipo=${tipo}, año=${año ?? "todos"})`);
  try {
    const filePath = path.join(process.cwd(), "data", DATA_FILES[tipo]);
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw) as Array<Record<string, unknown>>;

    if (!año) return JSON.stringify(data);

    const yearKey = tipo === "mundial" ? "año" : "mundial_año";
    const found = data.find((item) => item[yearKey] === año);
    if (!found) return JSON.stringify({ message: `No hay datos para el mundial ${año} en la categoría '${tipo}'.` });
    return JSON.stringify(found);
  } catch (e) {
    console.error("Error en buscarHistorial:", e);
    return JSON.stringify({ error: "No se pudo leer el historial." });
  }
}

// --- buscarWikipedia ---
export async function buscarWikipedia(consulta: string): Promise<string> {
  console.log(`🛠️ buscarWikipedia("${consulta}")`);
  try {
    // 1. Buscar el artículo más relevante
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(consulta)}&format=json&srlimit=1&srprop=snippet&origin=*`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
    const searchData = await searchRes.json() as { query?: { search?: Array<{ title: string; snippet: string }> } };
    const hit = searchData?.query?.search?.[0];
    if (!hit) return JSON.stringify({ message: "No se encontraron resultados en Wikipedia." });

    // 2. Obtener el resumen completo del artículo
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title)}`;
    const summaryRes = await fetch(summaryUrl, { signal: AbortSignal.timeout(5000) });
    const summary = await summaryRes.json() as { extract?: string; title?: string };

    return JSON.stringify({
      titulo: summary.title ?? hit.title,
      resumen: summary.extract ?? hit.snippet.replace(/<[^>]+>/g, ""),
    });
  } catch (e) {
    console.error("Error en buscarWikipedia:", e);
    return JSON.stringify({ error: "No se pudo consultar Wikipedia en este momento." });
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
      name: 'buscarHistorial',
      description: 'Busca datos históricos de los Mundiales FIFA. Úsala cuando el usuario pregunte sobre mundiales pasados, historial de México en mundiales, partidos memorables, goleadores históricos, campeones, resultados de años anteriores o cualquier dato de mundiales previos al 2026.',
      parameters: {
        type: 'object',
        properties: {
          tipo: {
            type: 'string',
            enum: ['mundial', 'mexico', 'memorable'],
            description: '"mundial" para datos generales de un mundial (campeón, goleador, etc.), "mexico" para los partidos y goleadores de México, "memorable" para los partidos más memorables.',
          },
          año: {
            type: 'number',
            description: 'El año del mundial (ej. 1986, 2010, 2022). Si el usuario pregunta de forma general (ej. "todos los mundiales de México"), omite este parámetro.',
          },
        },
        required: ['tipo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscarWikipedia',
      description: 'Busca información en Wikipedia para verificar o ampliar datos específicos sobre fútbol: goleadores, jugadas, récords, jugadores históricos, detalles de partidos. Úsala en inglés para mejores resultados. Úsala cuando necesites confirmar un dato puntual que no tienes en el historial local.',
      parameters: {
        type: 'object',
        properties: {
          consulta: {
            type: 'string',
            description: 'Búsqueda en inglés (ej. "Manuel Negrete 1986 FIFA World Cup goal", "1994 FIFA World Cup Mexico goals scored").',
          },
        },
        required: ['consulta'],
      },
    },
  },
];
