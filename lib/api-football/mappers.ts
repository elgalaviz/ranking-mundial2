import { ApiFixture } from "./client";

// API-Football devuelve league.round con estos formatos:
// "Group Stage - 1"   → Fase de Grupos, jornada 1
// "Group Stage - 2"   → Fase de Grupos, jornada 2
// "Group Stage - 3"   → Fase de Grupos, jornada 3
// "Round of 16"       → Octavos de Final
// "Quarter-finals"    → Cuartos de Final
// "Semi-finals"       → Semifinales
// "3rd Place Final"   → Tercer Lugar
// "Final"             → Final

// Traduce nombres en inglés de API-Football a los nombres en español usados en la BD
const TEAM_NAME_ES: Record<string, string> = {
  "Mexico": "México",
  "United States": "Estados Unidos",
  "USA": "Estados Unidos",
  "Canada": "Canadá",
  "Brazil": "Brasil",
  "Colombia": "Colombia",
  "Uruguay": "Uruguay",
  "Ecuador": "Ecuador",
  "Chile": "Chile",
  "Paraguay": "Paraguay",
  "Bolivia": "Bolivia",
  "Peru": "Perú",
  "Venezuela": "Venezuela",
  "Costa Rica": "Costa Rica",
  "Honduras": "Honduras",
  "Guatemala": "Guatemala",
  "Panama": "Panamá",
  "El Salvador": "El Salvador",
  "Jamaica": "Jamaica",
  "Trinidad And Tobago": "Trinidad y Tobago",
  "Trinidad & Tobago": "Trinidad y Tobago",
  "Cuba": "Cuba",
  "Haiti": "Haití",
  "Curacao": "Curazao",
  "Spain": "España",
  "France": "Francia",
  "Germany": "Alemania",
  "Portugal": "Portugal",
  "England": "Inglaterra",
  "Italy": "Italia",
  "Netherlands": "Países Bajos",
  "Belgium": "Bélgica",
  "Croatia": "Croacia",
  "Serbia": "Serbia",
  "Switzerland": "Suiza",
  "Denmark": "Dinamarca",
  "Austria": "Austria",
  "Scotland": "Escocia",
  "Poland": "Polonia",
  "Ukraine": "Ucrania",
  "Turkey": "Turquía",
  "Hungary": "Hungría",
  "Czech Republic": "Chequia",
  "Slovenia": "Eslovenia",
  "Slovakia": "Eslovaquia",
  "Romania": "Rumania",
  "Greece": "Grecia",
  "Norway": "Noruega",
  "Sweden": "Suecia",
  "Morocco": "Marruecos",
  "Senegal": "Senegal",
  "Nigeria": "Nigeria",
  "Ghana": "Ghana",
  "Cameroon": "Camerún",
  "Egypt": "Egipto",
  "Ivory Coast": "Costa de Marfil",
  "Côte d'Ivoire": "Costa de Marfil",
  "Mali": "Mali",
  "Algeria": "Argelia",
  "Tunisia": "Túnez",
  "South Africa": "Sudáfrica",
  "DR Congo": "RD Congo",
  "Democratic Republic of Congo": "RD Congo",
  "Japan": "Japón",
  "South Korea": "Corea del Sur",
  "Korea Republic": "Corea del Sur",
  "Australia": "Australia",
  "Saudi Arabia": "Arabia Saudita",
  "Iran": "Irán",
  "Iraq": "Irak",
  "Qatar": "Catar",
  "China": "China",
  "Uzbekistan": "Uzbekistán",
  "Indonesia": "Indonesia",
  "New Zealand": "Nueva Zelanda",
  "Bosnia and Herzegovina": "Bosnia-Herzegovina",
  "Bosnia & Herzegovina": "Bosnia-Herzegovina",
};

function toSpanish(name: string): string {
  return TEAM_NAME_ES[name] ?? name;
}

const ROUND_MAP: Record<string, string> = {
  "Round of 16":    "Octavos de Final",
  "Quarter-finals": "Cuartos de Final",
  "Semi-finals":    "Semifinales",
  "3rd Place Final": "Tercer Lugar",
  "Final":          "Final",
};

function parseRound(round: string): { fase: string; jornada: number | null } {
  if (ROUND_MAP[round]) {
    return { fase: ROUND_MAP[round], jornada: null };
  }
  const m = round.match(/Group Stage\s*[-–]\s*(\d+)/i);
  if (m) return { fase: "Fase de Grupos", jornada: parseInt(m[1]) };
  return { fase: round, jornada: null };
}

export type PartidoRow = {
  equipo_local:     string;
  equipo_visitante: string;
  fecha_utc:        string;
  estadio:          string | null;
  ciudad:           string | null;
  fase:             string | null;
  jornada:          number | null;
  goles_local:      number | null;
  goles_visitante:  number | null;
  alerta_enviada:   boolean;
};

export function fixtureToPartido(f: ApiFixture): PartidoRow {
  const { fase, jornada } = parseRound(f.league.round);

  // Para partidos terminados preferimos score.fulltime (más preciso que goals
  // cuando hay tiempo extra o penales).
  const golesLocal = f.score.fulltime.home ?? f.goals.home ?? null;
  const golesVisitante = f.score.fulltime.away ?? f.goals.away ?? null;

  return {
    equipo_local:     toSpanish(f.teams.home.name),
    equipo_visitante: toSpanish(f.teams.away.name),
    fecha_utc:        f.fixture.date,
    estadio:          f.fixture.venue.name ?? null,
    ciudad:           f.fixture.venue.city ?? null,
    fase,
    jornada,
    goles_local:      golesLocal,
    goles_visitante:  golesVisitante,
    alerta_enviada:   false,
  };
}

/** Para sync de resultados: solo actualiza goles, no sobreescribe alerta_enviada */
export function fixtureToResultado(f: ApiFixture): {
  goles_local: number;
  goles_visitante: number;
} | null {
  const h = f.score.fulltime.home ?? f.goals.home;
  const a = f.score.fulltime.away ?? f.goals.away;
  if (h === null || a === null) return null;
  return { goles_local: h, goles_visitante: a };
}
