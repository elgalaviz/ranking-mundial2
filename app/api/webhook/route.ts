import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSystemPrompt } from "@/lib/ai/systemPrompt";
import { sendWhatsAppText } from "@/lib/ai/sendWhatsAppText";
import { sendWhatsAppReplyButtons } from "@/lib/ai/sendWhatsAppInteractive";
import { tools, getPartidos } from "@/lib/ai/tools"; // Asegúrate que la importación de getPartidos sea correcta
import OpenAI from "openai";

export const runtime = "nodejs";

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "";

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
    const { data: waAccount, error: waError } = await supabase
      .from("whatsapp_accounts")
      .select("business_id, access_token")
      .eq("phone_number_id", phoneNumberId)
      .maybeSingle();

    if (waError || !waAccount?.business_id) {
      console.error("❌ Número no vinculado:", waError);
      return new NextResponse("ok", { status: 200 });
    }

    const business_id = waAccount.business_id;
    const accessToken = waAccount.access_token || "";

    // 2. MANEJAR RESPUESTA DE TRIVIA
    if (text === 'trivia_correcta' || text === 'trivia_incorrecta') {
      const { data: contactoTrivia } = await supabase
        .from("users")
        .select("id, jugo_trivia_hoy")
        .eq("phone", from)
        .eq("business_id", business_id)
        .single();

      // Solo procesar si el contacto existe y no ha jugado hoy
      if (contactoTrivia && !contactoTrivia.jugo_trivia_hoy) {
        let msg = "";
        if (text === 'trivia_correcta') {
          await supabase.from("users").update({
            consultas_extra_hoy: 2,
            jugo_trivia_hoy: true
          }).eq('id', contactoTrivia.id);
          msg = "¡Correcto! Eres un verdadero fan. 🥳 Has ganado 2 consultas extra para hoy, patrocinado por Strendus. ¿En qué más te puedo ayudar?";
        } else { // trivia_incorrecta
          await supabase.from("users").update({
            jugo_trivia_hoy: true
          }).eq('id', contactoTrivia.id);
          msg = "¡Casi! Esa no era la respuesta. 😕 Gracias por participar en la trivia de Strendus. ¡Nos vemos mañana para más consultas!";
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
      const hoy = new Date();
      const ultimaConsulta = user.fecha_ultima_consulta ? new Date(user.fecha_ultima_consulta) : null;
      
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
      const limiteDiario = 3 + (contactoActualizado.consultas_extra_hoy || 0);
      const consultasActuales = contactoActualizado.consultas_hoy || 0;

      console.log(`[DEBUG] Verificando límite para ${from}:`);
      console.log(`[DEBUG] - Consultas de hoy: ${consultasActuales}`);
      console.log(`[DEBUG] - Consultas extra: ${contactoActualizado.consultas_extra_hoy || 0}`);
      console.log(`[DEBUG] - Límite diario total: ${limiteDiario}`);
      console.log(`[DEBUG] - ¿Ha jugado trivia hoy?: ${contactoActualizado.jugo_trivia_hoy}`);
      console.log(`[DEBUG] - Condición a evaluar: ${consultasActuales} > ${limiteDiario}`);


      if (consultasActuales >= limiteDiario) {
        console.log(`[DEBUG] Condición (>=) CUMPLIDA. Entrando al bloque de límite.`);
        // Si no ha jugado la trivia hoy, se la ofrecemos.
        if (!contactoActualizado.jugo_trivia_hoy) {
            console.log(`[DEBUG] Ofreciendo trivia porque 'jugo_trivia_hoy' es false.`);
            console.log(`🚫 Límite de 3 consultas alcanzado para ${from}. Ofreciendo trivia generada por IA.`);
        const triviaSystemPrompt = "Eres un asistente que genera trivias de fútbol en formato JSON.";
          const triviaUserPrompt = `Genera una trivia de opción múltiple sobre la Selección Mexicana de Fútbol. La pregunta debe ser de dificultad media para un aficionado. La respuesta correcta debe tener el id 'trivia_correcta' y las otras dos 'trivia_incorrecta'. Las opciones deben venir en orden aleatorio. Devuelve únicamente el objeto JSON con la siguiente estructura: // RECOMENDACIÓN: Considera cambiar "tus 3 mensajes diarios se terminaron" a "has alcanzado tu límite de mensajes gratuitos" para que sea más preciso.
          {
            "body": "Lo siento, tus 3 mensajes diarios se terminaron. ¡Pero te propongo algo! Una trivia patrocinada por Strendus: si aciertas, ganas 2 mensajes más.\\n\\n*AQUÍ LA PREGUNTA*",
            "buttons": [
              {"id": "trivia_incorrecta", "title": "Respuesta Incorrecta A"},
              {"id": "trivia_correcta", "title": "Respuesta Correcta"},
              {"id": "trivia_incorrecta", "title": "Respuesta Incorrecta B"}
            ]
          }`;

          try {
            const triviaResponse = await openai.chat.completions.create({
              model: process.env.OPENAI_MODEL || "gpt-4o-mini",
              messages: [
                { role: "system", content: triviaSystemPrompt },
                { role: "user", content: triviaUserPrompt },
              ],
              response_format: { type: "json_object" },
            });
            const triviaContent = triviaResponse.choices[0].message.content;
            const triviaJson = JSON.parse(triviaContent || "{}");

            if (triviaJson.body && triviaJson.buttons) {
              await sendWhatsAppReplyButtons({ accessToken, phoneNumberId, to: from, body: triviaJson.body, buttons: triviaJson.buttons });
              await supabase.from("mensajes_recibidos").insert({
                whatsapp: from, texto: triviaJson.body, tipo: "bot", business_id: business_id,
              });
            } else {
              throw new Error("El JSON de la trivia no tiene el formato esperado.");
            }
          } catch (e) {
            console.error("❌ Error generando trivia con IA, enviando trivia fija de respaldo.", e);
            const fallbackTriviaBody = "Lo siento, has alcanzado tu límite de mensajes gratuitos por hoy. ¡Pero te propongo algo! Una trivia patrocinada por Strendus: si aciertas, ganas 2 mensajes más.\n\n*¿Quién es el máximo goleador histórico de la Selección Mexicana?* ⚽";
            const fallbackButtons = [{ id: 'trivia_correcta', title: 'Javier Hernández' }, { id: 'trivia_incorrecta', title: 'Hugo Sánchez' }, { id: 'trivia_incorrecta', title: 'Cuauhtémoc Blanco' }];
            await sendWhatsAppReplyButtons({ accessToken, phoneNumberId, to: from, body: fallbackTriviaBody, buttons: fallbackButtons });
            await supabase.from("mensajes_recibidos").insert({
              whatsapp: from, texto: fallbackTriviaBody, tipo: "bot", business_id: business_id,
            });
          }
      } else {
          // Si ya jugó, se le informa que alcanzó el límite final.
          console.log(`[DEBUG] Enviando mensaje de límite final porque 'jugo_trivia_hoy' es true.`);
          console.log(`🚫 Límite de ${limiteDiario} consultas diarias excedido para ${from}.`);
          const respuestaLimite = "Has alcanzado tu límite de consultas por hoy. ¡Nos vemos mañana! ⭐";
          
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

    // --- Lógica de Herramientas ---
    let response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: messages,
      tools: tools,
      tool_choice: "auto",
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