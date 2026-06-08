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

// --- getGrupos ---
export async function getGrupos(grupo?: string): Promise<string> {
  console.log(`🛠️ getGrupos(grupo=${grupo || "todos"})`);
  try {
    const res = await fetch("https://v3.football.api-sports.io/standings?league=1&season=2026", {
      headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY! },
      cache: "no-store",
    });
    const json = await res.json();
    const groups: any[][] = json.response?.[0]?.league?.standings || [];

    if (groups.length === 0) return JSON.stringify({ message: "Aún no hay posiciones disponibles. El torneo empieza el 11 de junio." });

    const filtered = grupo
      ? groups.filter(g => g[0]?.group?.toLowerCase().includes(grupo.toLowerCase()))
      : groups;

    if (filtered.length === 0) return JSON.stringify({ message: `No encontré el grupo '${grupo}'.` });

    const result = filtered.map(g => ({
      grupo: g[0]?.group,
      equipos: g.map((s: any) => ({
        pos: s.rank,
        equipo: s.team.name,
        pj: s.all.played,
        g: s.all.win,
        e: s.all.draw,
        p: s.all.lose,
        gf: s.all.goals.for,
        gc: s.all.goals.against,
        dg: s.goalsDiff,
        pts: s.points,
      })),
    }));

    return JSON.stringify(result);
  } catch (e) {
    return JSON.stringify({ error: "No se pudieron obtener las posiciones en este momento." });
  }
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

// --- getJugadores ---
export async function getJugadores(equipo?: string, posicion?: string, nombre?: string): Promise<string> {
  console.log(`🛠️ getJugadores(equipo=${equipo}, posicion=${posicion}, nombre=${nombre})`);
  const supabase = getSupabase();
  try {
    let query = supabase
      .from("jugadores")
      .select("nombre, posicion, numero, edad, selecciones(nombre)")
      .limit(30);

    if (equipo) {
      const { data: sel } = await supabase
        .from("selecciones")
        .select("id")
        .ilike("nombre", `%${equipo}%`)
        .limit(1)
        .single();
      if (sel) query = query.eq("team_id", sel.id);
      else return JSON.stringify({ message: `No encontré la selección '${equipo}' en la base de datos.` });
    }
    if (posicion) query = query.ilike("posicion", `%${posicion}%`);
    if (nombre) query = query.ilike("nombre", `%${nombre}%`);

    query = query.order("posicion").order("numero");

    const { data, error } = await query;
    if (error) return JSON.stringify({ error: "Error al consultar jugadores." });
    if (!data || data.length === 0) return JSON.stringify({ message: "No encontré jugadores con esos criterios." });

    const POSICION_ES: Record<string, string> = {
      Goalkeeper: "Portero", Defender: "Defensa",
      Midfielder: "Medio",  Attacker: "Delantero",
    };

    return JSON.stringify(data.map(j => ({
      nombre: j.nombre,
      posicion: POSICION_ES[j.posicion ?? ""] ?? j.posicion,
      numero: j.numero,
      edad: j.edad,
      seleccion: (j.selecciones as any)?.nombre,
    })));
  } catch (e) {
    return JSON.stringify({ error: "No se pudo consultar la lista de jugadores." });
  }
}

// --- getTriviaAleatoria ---
export function getTriviaAleatoria(): string {
  console.log("🛠️ getTriviaAleatoria()");
  try {
    const filePath = path.join(process.cwd(), "data", "trivia_mexico.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const list = JSON.parse(raw) as Array<{ id: number; pregunta: string; opciones: string[]; respuesta: string; dato: string }>;
    if (list.length === 0) return JSON.stringify({ error: "No hay trivias disponibles." });
    const q = list[Math.floor(Math.random() * list.length)];
    // Devuelve la pregunta con los botones listos para enviar
    const buttons = q.opciones.map((op, i) => ({
      id: `trivia_mx_${q.id}_${i}`,
      title: op.slice(0, 20),
    }));
    return JSON.stringify({ pregunta: q.pregunta, buttons, tipo: "trivia_interactiva" });
  } catch (e) {
    return JSON.stringify({ error: "No se pudo cargar la trivia." });
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
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(3000) });
    const searchData = await searchRes.json() as { query?: { search?: Array<{ title: string; snippet: string }> } };
    const hit = searchData?.query?.search?.[0];
    if (!hit) return JSON.stringify({ message: "No se encontraron resultados en Wikipedia." });

    // 2. Obtener el resumen (paralelo al paso 1 ya terminó, solo fetch del summary)
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title)}`;
    const summaryRes = await fetch(summaryUrl, { signal: AbortSignal.timeout(3000) });
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
      name: 'getGrupos',
      description: 'Obtiene la tabla de posiciones de los grupos del Mundial 2026 en tiempo real. Úsala cuando el usuario pregunte por posiciones, tabla, cómo va un grupo, cuántos puntos tiene un equipo, quién va primero, o si un equipo clasifica.',
      parameters: {
        type: 'object',
        properties: {
          grupo: {
            type: 'string',
            description: 'Nombre del grupo a consultar, ej. "Group A", "A", "Grupo B". Si se omite, devuelve todos los grupos.',
          },
        },
        required: [],
      },
    },
  },
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
      name: 'getJugadores',
      description: 'Obtiene la lista de jugadores de una selección del Mundial 2026. Úsala cuando el usuario pregunte por el squad, plantilla, jugadores o convocados de un equipo, o busque a un jugador específico por nombre.',
      parameters: {
        type: 'object',
        properties: {
          equipo: {
            type: 'string',
            description: 'Nombre del equipo (ej. "Mexico", "Argentina", "Francia"). Omitir si se busca por nombre de jugador.',
          },
          posicion: {
            type: 'string',
            enum: ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'],
            description: 'Filtrar por posición. Opcional.',
          },
          nombre: {
            type: 'string',
            description: 'Nombre o apellido del jugador a buscar (ej. "Messi", "Ochoa"). Omitir si se busca por equipo.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getTriviaAleatoria',
      description: 'Obtiene una pregunta de trivia aleatoria sobre la Selección Mexicana con sus opciones de respuesta. Úsala cuando el usuario pida una trivia, un juego, o quiera saber algo curioso sobre México.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscarHistorial',
      description: 'PRIMERA OPCIÓN para cualquier dato histórico de Mundiales FIFA: campeones, goleadores, resultados, estadísticas, historial de México, partidos memorables. Úsala SIEMPRE antes de buscarWikipedia. Es instantánea y cubre todos los mundiales hasta Qatar 2022.',
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
      description: 'ÚLTIMO RECURSO: solo úsala si el dato NO está en buscarHistorial y el usuario lo pidió explícitamente. Evita llamarla para preguntas generales o datos que ya conoces. Tarda varios segundos.',
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
