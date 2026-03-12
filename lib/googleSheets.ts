import { google } from "googleapis";

export interface Lead {
  nombre: string;
  telefono: string;
  fuente?: string;
  estado?: string;
  mensajeInicial?: string;
  ultimoMensaje?: string;
  fechaContacto?: string;
  ultimoContacto?: string;
  vecesContacto?: number;
  resumenConversacion?: string;
  ultimoTema?: string;
  necesidadDetectada?: string;
  ultimaRespuestaBot?: string;
  wamid?: string;
  notas?: string;
  etiqueta?: string;
}

const SHEET_NAME = "contactos";

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
  ],
});

export async function getLeadsFromSheet(): Promise<Lead[]> {
  await auth.authorize();

  const sheets = google.sheets({
    version: "v4",
    auth,
  });

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A:P`,
  });

  const rows = response.data.values || [];

  if (rows.length === 0) return [];

  const dataRows = rows.slice(1);

  return dataRows.map((row) => ({
    nombre: row[0] || "",
    telefono: row[1] || "",
    mensajeInicial: row[2] || "",
    ultimoMensaje: row[3] || "",
    fechaContacto: row[4] || "",
    fuente: row[5] || "",
    estado: row[6] || "",
    notas: row[7] || "",
    etiqueta: row[8] || "",
    ultimoContacto: row[9] || "",
    vecesContacto: Number(row[10] || 0),
    resumenConversacion: row[11] || "",
    ultimoTema: row[12] || "",
    necesidadDetectada: row[13] || "",
    ultimaRespuestaBot: row[14] || "",
    wamid: row[15] || "",
  }));
}

export async function updateLeadNotesByPhone(
  telefono: string,
  notas: string
): Promise<boolean> {
  await auth.authorize();

  const sheets = google.sheets({
    version: "v4",
    auth,
  });

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A:P`,
  });

  const rows = response.data.values || [];

  if (rows.length === 0) return false;

  const dataRows = rows.slice(1);

  const rowIndex = dataRows.findIndex(
    (row) => String(row[1] || "").trim() === String(telefono).trim()
  );

  if (rowIndex === -1) return false;

  const realSheetRow = rowIndex + 2;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!H${realSheetRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[notas]],
    },
  });

  return true;
}