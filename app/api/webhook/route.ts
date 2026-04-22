import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSystemPrompt } from "@/lib/ai/systemPrompt";
import { sendWhatsAppText } from "@/lib/ai/sendWhatsAppText";
import { sendWhatsAppReplyButtons } from "@/lib/ai/sendWhatsAppInteractive";
import { tools, getPartidos } from "@/lib/ai/tools"; // Asegúrate que la importación de getPartidos sea correcta
import { limitReachedMessage } from "@/lib/fanbot/messages";
import OpenAI from "openai";

export const runtime = "nodejs";

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rankingmundial26.com";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

// --- Helper Functions ---
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
const isSameDayInMX = (d1: Date, d2: Date | null): boolean => {
  if (!d2) return false;
  const tz = "America/Mexico_City";
  const d1Str = d1.toLocaleDateString("en-CA", { timeZone: tz });
  return new Date(d2).toLocaleDateString("en-CA", { timeZone: tz }) === d1Str;
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Error de verificación", { status: 403 });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  try {
    const body = await req.json();
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    // Ignorar eventos que no son mensajes (ej. estados 'delivered', 'read')
    if (!message) {
      // Si es una actualización de estado (ej. 'delivered', 'read'), lo registramos y terminamos.
      if (value?.statuses?.[0]) {
        console.log(`✅ Estado de mensaje recibido: ${value.statuses[0].status} para ${value.statuses[0].recipient_id}`);
        return new NextResponse("ok", { status: 200 });
      }
      // Si es otro tipo de payload que no manejamos, lo registramos para depuración.
      console.log("⚠️ Payload no contiene mensajes ni estados, ignorando.");
      return new NextResponse("ok", { status: 200 });
    }

    const phoneNumberId = String(value?.metadata?.phone_number_id || "").trim();
    const from = message.from;
    const messageId = message.id;

    // Extraer texto del mensaje (normal o interactivo)
    let text: string;
    if (message.type === 'interactive') {
      const interactiveType = message.interactive.type;
      if (interactiveType === 'button_reply') {
        // Usamos el ID del botón como el "texto" que procesará la IA
        text = message.interactive.button_reply.id;
      } else if (interactiveType === 'list_reply') {
        // Usamos el ID de la fila como el "texto"
        text = message.interactive.list_reply.id;
      } else {
        console.log('Tipo de mensaje interactivo desconocido.');
        return new NextResponse("ok", { status: 200 });
      }
    } else if (message.type === 'text') {
      text = message.text?.body || "";
    } else {
      console.log('Tipo de mensaje no soportado.');
      return new NextResponse("ok", { status: 200 });
    }

    const profileName = value?.contacts?.[0]?.profile?.name || null;
    console.log(`💬 Mensaje de ${from} (${profileName || 'sin nombre'}): "${text}"`);


    // 1. MAPEAR A NEGOCIO
    // Al no tener tabla whatsapp_accounts, usamos variables de entorno directamente
    const business_id = process.env.WHATSAPP_BUSINESS_ID || "ranking-mundial";
    const accessToken = process.env.WHATSAPP_TOKEN || "";

    if (!accessToken) {
      console.error("❌ Falta configurar WHATSAPP_TOKEN en .env");
      return new NextResponse("ok", { status: 200 });
    }

    // 2. MANEJAR RESPUESTA DE TRIVIA
    if (text === 'trivia_correcta' || text.startsWith('trivia_incorrecta')) {
      const { data: contactoTrivia } = await supabase
        .from("users")
        .select("id, jugo_trivia_hoy")
        .eq("phone", from)
        .eq("business_id", business_id)
        .single();

      // Solo procesar si el contacto existe y no ha jugado hoy
      if (contactoTrivia && !contactoTrivia.jugo_trivia_hoy) {
        const { data: patrocinadorResp } = await supabase
          .from('patrocinadores').select('nombre').eq('activo', true).limit(1).maybeSingle();
        const nombrePatrocinadorResp = patrocinadorResp?.nombre || "nuestros amigos";

        let msg = "";
        if (text === 'trivia_correcta') {
          await supabase.from("users").update({
            consultas_extra_hoy: 3,
            jugo_trivia_hoy: true
          }).eq('id', contactoTrivia.id);
          msg = `¡Correcto! Eres un verdadero fan. 🥳 Has ganado 3 consultas extra para hoy, patrocinado por ${nombrePatrocinadorResp}. ¿En qué más te puedo ayudar?`;
        } else { // trivia_incorrecta
          await supabase.from("users").update({
            jugo_trivia_hoy: true
          }).eq('id', contactoTrivia.id);
          msg = `¡Casi! Esa no era la respuesta. 😕 Gracias por participar en la trivia de ${nombrePatrocinadorResp}. ¡Nos vemos mañana para más consultas!`;
        }

        await sendWhatsAppText({ accessToken, phoneNumberId, to: from, body: msg });
        await supabase.from("mensajes_recibidos").insert({
          whatsapp: from, texto: msg, tipo: "bot", business_id: business_id,
        });
      }
      // En cualquier caso, detenemos el procesamiento aquí para las respuestas de la trivia.
      // Si ya jugó, simplemente ignoramos el clic en el botón.
      return new NextResponse("ok", { status: 200 });
    }

    // 3. BUSCAR O CREAR USUARIO Y MANEJAR LÍMITES
    let { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("business_id", business_id)
      .eq("phone", from)
      .maybeSingle();

    if (!user) {
      const { data: nuevo } = await supabase
        .from("users")
        .insert({
          phone: from,
          whatsapp_id: from,
          name: profileName,
          business_id: business_id,
          plan: 'free',
          consultas_hoy: 1,
          fecha_ultima_consulta: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      user = nuevo;
      console.log("👤 Usuario creado:", profileName ?? "sin nombre");
    } else {
      // Lógica para el límite diario de consultas
      console.log("[DEBUG] Datos del usuario ANTES del reseteo diario:", {
        consultas_hoy: user.consultas_hoy,
        jugo_trivia_hoy: user.jugo_trivia_hoy,
        fecha_ultima_consulta: user.fecha_ultima_consulta,
        consultas_reset: user.consultas_reset, // Incluido para depuración de usuarios legacy
      });

      const hoy = new Date();
      // HACK: Se añade fallback a `consultas_reset` para dar soporte a usuarios legacy
      // que no tienen `fecha_ultima_consulta`.
      const ultimaConsulta = user.fecha_ultima_consulta ? new Date(user.fecha_ultima_consulta) : 
                             (user.consultas_reset ? new Date(user.consultas_reset) : null);
      
      let consultasHoy = user.consultas_hoy || 0;
      let jugoTrivia = user.jugo_trivia_hoy || false;
      let consultasExtra = user.consultas_extra_hoy || 0;

      if (ultimaConsulta && isSameDayInMX(hoy, ultimaConsulta)) {
        consultasHoy++;
      } else {
        // Es un nuevo día, se resetea todo
        consultasHoy = 1;
        jugoTrivia = false;
        consultasExtra = 0;
      }

      // 💡 REFACTOR: Actualizamos el contacto con los nuevos contadores ANTES de checar el límite.
      // Así nos aseguramos que el estado se guarde siempre, incluso si el usuario ya no puede consultar.
      const updateData: any = {
        consultas_hoy: consultasHoy,
        jugo_trivia_hoy: jugoTrivia,
        consultas_extra_hoy: consultasExtra,
        fecha_ultima_consulta: hoy.toISOString(),
      };

      if (profileName && (!user.name || user.name === 'Desconocido')) {
        updateData.name = profileName;
      }

      const { data: updatedContact, error: updateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", user.id)
        .select("*")
        .single();

      if (updateError) {
        console.error("❌ Error actualizando el contador del contacto:", updateError);
      }

      // Usamos el contacto recién actualizado para las validaciones
      const contactoActualizado = updatedContact || user;
      const limiteDiario = 5 + (contactoActualizado.consultas_extra_hoy || 0);
      const consultasActuales = contactoActualizado.consultas_hoy || 0;

      console.log(`[DEBUG] Verificando límite para ${from}:`);
      console.log(`[DEBUG] - Consultas de hoy: ${consultasActuales}`);
      console.log(`[DEBUG] - Consultas extra: ${contactoActualizado.consultas_extra_hoy || 0}`);
      console.log(`[DEBUG] - Límite diario total: ${limiteDiario}`);
      console.log(`[DEBUG] - ¿Ha jugado trivia hoy?: ${contactoActualizado.jugo_trivia_hoy}`);
      console.log(`[DEBUG] - Condición a evaluar: ${consultasActuales} >= ${limiteDiario}`);


      if (consultasActuales >= limiteDiario) {
        console.log(`[DEBUG] Condición (>=) CUMPLIDA. Entrando al bloque de límite.`);
        // Si no ha jugado la trivia hoy, se la ofrecemos.

        // Obtener un patrocinador activo aleatoriamente
        const { data: patrocinador } = await supabase
          .from('patrocinadores')
          .select('nombre')
          .eq('activo', true)
          .limit(1)
          .maybeSingle();
        const nombrePatrocinador = patrocinador?.nombre || "nuestros amigos";

        if (!contactoActualizado.jugo_trivia_hoy) {
            console.log(`[DEBUG] Ofreciendo trivia porque 'jugo_trivia_hoy' es false.`);
            const footer = `Trivia patrocinada por: ${nombrePatrocinador}`;
            const triviaUserPrompt = `Genera una trivia de fútbol sobre la Selección Mexicana. Dificultad media. Devuelve SOLO este JSON:
{
  "pregunta": "¿La pregunta aquí? (máx 120 caracteres)",
  "correcta": "Respuesta correcta (máx 18 caracteres)",
  "incorrecta_1": "Opción falsa 1 (máx 18 caracteres)",
  "incorrecta_2": "Opción falsa 2 (máx 18 caracteres)"
}`;

          try {
            const triviaResponse = await openai.chat.completions.create({
              model: process.env.OPENAI_MODEL || "gpt-4o-mini",
              messages: [
                { role: "system", content: "Eres un generador de trivias de fútbol. Responde solo con el JSON solicitado." },
                { role: "user", content: triviaUserPrompt },
              ],
              response_format: { type: "json_object" },
            });
            const t = JSON.parse(triviaResponse.choices[0].message.content || "{}");
            if (!t.pregunta || !t.correcta || !t.incorrecta_1 || !t.incorrecta_2) throw new Error("JSON incompleto");

            const opciones = [
              { id: 'trivia_correcta',    title: String(t.correcta).slice(0, 18) },
              { id: 'trivia_incorrecta_a', title: String(t.incorrecta_1).slice(0, 18) },
              { id: 'trivia_incorrecta_b', title: String(t.incorrecta_2).slice(0, 18) },
            ].sort(() => Math.random() - 0.5);

            const triviaBody = `Has alcanzado tu límite de mensajes gratuitos. ¡Si aciertas la trivia, ganas 3 mensajes más!\n\n*${t.pregunta}*`;
            await sendWhatsAppReplyButtons({ accessToken, phoneNumberId, to: from, body: triviaBody, buttons: opciones, footer });
            await supabase.from("mensajes_recibidos").insert({ whatsapp: from, texto: triviaBody, tipo: "bot", business_id });
          } catch (e) {
            console.error("❌ Error generando trivia con IA, usando fallback.", e);
            const opciones = [
              { id: 'trivia_correcta',    title: 'Javier Hernández' },
              { id: 'trivia_incorrecta_a', title: 'Hugo Sánchez' },
              { id: 'trivia_incorrecta_b', title: 'Cuauhtémoc Blanco' },
            ].sort(() => Math.random() - 0.5);
            const fallbackBody = `Has alcanzado tu límite de mensajes gratuitos. ¡Si aciertas la trivia, ganas 3 mensajes más!\n\n*¿Quién es el máximo goleador histórico de la Selección Mexicana?* ⚽`;
            await sendWhatsAppReplyButtons({ accessToken, phoneNumberId, to: from, body: fallbackBody, buttons: opciones, footer });
            await supabase.from("mensajes_recibidos").insert({ whatsapp: from, texto: fallbackBody, tipo: "bot", business_id });
          }
      } else {
          // Si ya jugó, se le informa que alcanzó el límite final.
          console.log(`[DEBUG] Enviando mensaje de límite final porque 'jugo_trivia_hoy' es true.`);
          console.log(`🚫 Límite de ${limiteDiario} consultas diarias excedido para ${from}.`);
          const respuestaLimite = limitReachedMessage(APP_URL);
          
          await sendWhatsAppText({ accessToken, phoneNumberId, to: from, body: respuestaLimite });
          await supabase.from("mensajes_recibidos").insert({
            whatsapp: from, texto: respuestaLimite, tipo: "bot", business_id: business_id,
          });
      }
      return new NextResponse("ok", { status: 200 });
      } else {
        console.log(`[DEBUG] Condición (>=) NO CUMPLIDA. Procesando mensaje normalmente.`);
      }

      user = contactoActualizado;
    }

    // 4. GENERAR RESPUESTA CON IA (SIN HISTORIAL)
    const systemPrompt = getSystemPrompt({ contacto: user || {} });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ];

    // Forzar la herramienta cuando el mensaje claramente pide datos de partidos,
    // para evitar que el modelo responda desde su conocimiento de entrenamiento.
    const MATCH_TRIGGERS = ['partido', 'juego', 'juega', 'jugará', 'jugaran', 'fecha', 'horario',
      'estadio', 'calendario', 'grupo', 'cuándo', 'cuando', 'cuand', 'primer partido',
      'próximo partido', 'proximo partido', 'resultado', 'marcador', 'jornada', 'fase'];
    const textLower = text.toLowerCase();
    const forceMatchTool = MATCH_TRIGGERS.some(kw => textLower.includes(kw));
    const toolChoice = forceMatchTool
      ? ({ type: "function", function: { name: "getPartidos" } } as const)
      : ("auto" as const);

    if (forceMatchTool) console.log("🛠️ Forzando herramienta getPartidos por keywords en el mensaje.");

    // --- Lógica de Herramientas ---
    let response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: messages,
      tools: tools,
      tool_choice: toolChoice,
    });

    let responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    if (toolCalls) {
      console.log("🛠️  IA solicitó llamada a herramienta:", toolCalls);
      messages.push(responseMessage);

      for (const toolCall of toolCalls) {
        // Añadimos un type guard para asegurar que es una llamada a función
        if (toolCall.type === 'function') {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          let functionResponse;

          if (functionName === 'getPartidos') {
            functionResponse = await getPartidos(functionArgs.equipo);
          } else {
            console.error(`❌ Herramienta desconocida: ${functionName}`);
            continue;
          }

          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: functionResponse,
          });
        }
      }

      console.log("🗣️  Enviando a OpenAI con resultado de herramienta...");
      const secondResponse = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: messages,
      });
      responseMessage = secondResponse.choices[0].message;
    }

    const aiResponseText = responseMessage.content || "No pude procesar tu solicitud en este momento. Intenta de nuevo más tarde.";
    console.log("🤖 Respuesta IA:", aiResponseText);

    // 5. ENVIAR RESPUESTA
    let respuestaParsed: any;
    try {
      // Intenta parsear la respuesta como JSON para mensajes interactivos
      respuestaParsed = JSON.parse(aiResponseText);
    } catch (e) {
      // Si falla, es una respuesta de texto plano
      respuestaParsed = { type: 'text', body: aiResponseText };
    }

    let resultadoEnvio;

    if (respuestaParsed.type === 'buttons' && respuestaParsed.buttons) {
      resultadoEnvio = await sendWhatsAppReplyButtons({
        accessToken, phoneNumberId, to: from,
        body: respuestaParsed.body,
        buttons: respuestaParsed.buttons,
      });
    } else {
      resultadoEnvio = await sendWhatsAppText({
        accessToken, phoneNumberId, to: from,
        body: respuestaParsed.body,
      });
    }

    if (!resultadoEnvio.ok) {
      console.error("❌ Error enviando WhatsApp:", resultadoEnvio.error);
    } else {
      console.log("✅ Mensaje enviado");
    }

    return new NextResponse("ok", { status: 200 });
  } catch (error) {
    console.error("🔥 Webhook error:", error);
    return new NextResponse("error", { status: 500 });
  }
}