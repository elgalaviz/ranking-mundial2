import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateReply } from "@/lib/ai/reply";
import { getSystemPrompt } from "@/lib/ai/systemPrompt";
import { buildReplyPrompt } from "@/lib/ai/replyPrompt";
import { extractMemory } from "@/lib/ai/memory";
import { sendWhatsAppText } from "@/lib/ai/sendWhatsAppText"; // Asumimos que este existe
import { sendWhatsAppReplyButtons, sendWhatsAppListMessage } from "@/lib/ai/sendWhatsAppInteractive"; // Importamos las nuevas funciones

export const runtime = "nodejs";

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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
    console.log("🔥 WEBHOOK HIT");

    const body = await req.json();
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

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

    // ✅ MEJORADO: Manejar respuestas de mensajes interactivos
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

    // ✅ NUEVO: Extraer nombre del perfil de WhatsApp
    const profileName = value?.contacts?.[0]?.profile?.name || null;

    console.log("📞 phoneNumberId:", phoneNumberId);
    console.log("👤 Nombre del perfil:", profileName);
    console.log("💬 Mensaje recibido:", text);

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

    const businessId = waAccount.business_id;
    const accessToken = waAccount.access_token || "";

    // +++ NUEVO: Manejar respuesta de la trivia +++
    if (text === 'trivia_correcta' || text === 'trivia_incorrecta') {
      const { data: contactoTrivia } = await supabase
        .from("contactos")
        .select("id, jugo_trivia_hoy")
        .eq("whatsapp", from)
        .eq("business_id", businessId)
        .single();

      // Solo procesar si el contacto existe y no ha jugado hoy
      if (contactoTrivia && !contactoTrivia.jugo_trivia_hoy) {
        let msg = "";
        if (text === 'trivia_correcta') {
          await supabase.from("contactos").update({
            consultas_extra_hoy: 2,
            jugo_trivia_hoy: true
          }).eq('id', contactoTrivia.id);
          msg = "¡Correcto! Eres un verdadero fan. 🥳 Has ganado 2 consultas extra para hoy, patrocinado por Strendus. ¿En qué más te puedo ayudar?";
        } else { // trivia_incorrecta
          await supabase.from("contactos").update({
            jugo_trivia_hoy: true
          }).eq('id', contactoTrivia.id);
          msg = "¡Casi! Esa no era la respuesta. 😕 Gracias por participar en la trivia de Strendus. ¡Nos vemos mañana para más consultas!";
        }

        await sendWhatsAppText({ accessToken, phoneNumberId, to: from, body: msg });
        await supabase.from("mensajes_recibidos").insert({
          whatsapp: from, texto: msg, tipo: "bot", business_id: businessId,
        });
      }
      // En cualquier caso, detenemos el procesamiento aquí para las respuestas de la trivia.
      // Si ya jugó, simplemente ignoramos el clic en el botón.
      return new NextResponse("ok", { status: 200 });
    }

    // 2. EVITAR DUPLICADOS
    const { error: insertError } = await supabase
      .from("mensajes_recibidos")
      .insert({ whatsapp: from, texto: text, tipo: "cliente", message_id: messageId, business_id: businessId });

    if (insertError) {
      console.log("⚠️ Mensaje duplicado:", messageId);
      return new NextResponse("ok", { status: 200 });
    }

    console.log("💾 Mensaje guardado");

    // 4. BUSCAR O CREAR CONTACTO
    let { data: contacto } = await supabase
      .from("contactos")
      .select("*")
      .eq("business_id", businessId)
      .eq("whatsapp", from)
      .maybeSingle();

    if (!contacto) {
      const { data: nuevo } = await supabase
        .from("contactos")
        .insert({
          whatsapp: from,
          business_id: businessId,
          estado: "interesado",
          veces_contacto: 1,
          nombre: profileName,  // ✅ NUEVO: Guardar nombre del perfil
          consultas_hoy: 1,
          fecha_ultima_consulta: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      contacto = nuevo;
      console.log("👤 Contacto creado:", profileName ?? "sin nombre");
    } else {
      // Lógica para el límite diario de consultas
      const isSameDayInMX = (d1: Date, d2: Date | null): boolean => {
        if (!d2) return false;
        const tz = "America/Mexico_City";
        const d1Str = d1.toLocaleDateString("en-CA", { timeZone: tz });
        const d2Str = new Date(d2).toLocaleDateString("en-CA", { timeZone: tz });
        return d1Str === d2Str;
      };

      const hoy = new Date();
      const ultimaConsulta = contacto.fecha_ultima_consulta ? new Date(contacto.fecha_ultima_consulta) : null;
      
      let consultasHoy = contacto.consultas_hoy || 0;
      let jugoTrivia = contacto.jugo_trivia_hoy || false;
      let consultasExtra = contacto.consultas_extra_hoy || 0;

      if (ultimaConsulta && isSameDayInMX(hoy, ultimaConsulta)) {
        consultasHoy++;
      } else {
        // Es un nuevo día, se resetea todo
        consultasHoy = 1;
        jugoTrivia = false;
        consultasExtra = 0;
      }

      const limiteDiario = 3 + consultasExtra;

      if (consultasHoy > limiteDiario) {
        // Si no ha jugado la trivia hoy, se la ofrecemos.
        if (!jugoTrivia) {
            console.log(`🚫 Límite de 3 consultas alcanzado para ${from}. Ofreciendo trivia.`);
            
            const triviaBody = "Lo siento, tus 3 mensajes diarios se terminaron. ¡Pero te propongo algo! Una trivia patrocinada por Strendus: si aciertas, ganas 2 mensajes más.\n\n*¿Quién es el máximo goleador histórico de la Selección Mexicana?* ⚽";
            const triviaButtons = [
                { id: 'trivia_correcta', title: 'Javier Hernández' },
                { id: 'trivia_incorrecta', title: 'Hugo Sánchez' },
                { id: 'trivia_incorrecta', title: 'Cuauhtémoc Blanco' }
            ];

            await sendWhatsAppReplyButtons({ accessToken, phoneNumberId, to: from, body: triviaBody, buttons: triviaButtons });
            await supabase.from("mensajes_recibidos").insert({
              whatsapp: from, texto: triviaBody, tipo: "bot", business_id: businessId,
            });
        } else {
            // Si ya jugó, se le informa que alcanzó el límite final.
            console.log(`🚫 Límite de ${limiteDiario} consultas diarias excedido para ${from}.`);
            const respuestaLimite = "Has alcanzado tu límite de consultas por hoy. ¡Nos vemos mañana! ⭐";
            
            await sendWhatsAppText({ accessToken, phoneNumberId, to: from, body: respuestaLimite });
            await supabase.from("mensajes_recibidos").insert({
              whatsapp: from, texto: respuestaLimite, tipo: "bot", business_id: businessId,
            });
        }
        return new NextResponse("ok", { status: 200 });
      }

      const updateData: any = {
        veces_contacto: (contacto.veces_contacto || 0) + 1,
        consultas_hoy: consultasHoy,
        jugo_trivia_hoy: jugoTrivia,
        consultas_extra_hoy: consultasExtra,
        fecha_ultima_consulta: hoy.toISOString(),
      };

      if (profileName && (!contacto.nombre || contacto.nombre === 'Desconocido')) {
        updateData.nombre = profileName;
      }

      const { data: updatedContact } = await supabase
        .from("contactos")
        .update(updateData)
        .eq("id", contacto.id)
        .select()
        .single();
      
      contacto = updatedContact;
    }

    // 5. OBTENER HISTORIAL RECIENTE (últimos 10 mensajes)
    const { data: historialData } = await supabase
      .from("mensajes_recibidos")
      .select("texto, tipo")
      .eq("whatsapp", from)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Invertir para orden cronológico y mapear a formato OpenAI
    const history = (historialData || [])
      .reverse()
      .slice(0, -1) // quitar el último que es el mensaje actual
      .map((m) => ({
        role: m.tipo === "bot" ? "assistant" as const : "user" as const,
        content: m.texto || "",
      }));

    console.log(`📜 Historial: ${history.length} mensajes anteriores`);

    // 6. GENERAR RESPUESTA IA
    const systemPrompt = getSystemPrompt({ contacto: contacto || {} });
    const userPrompt = buildReplyPrompt({ contacto: contacto || {}, incomingMessage: text });

    const respuestaIA = await generateReply({ systemPrompt, userPrompt, history });
    console.log("🤖 Respuesta IA:", respuestaIA);

    let respuestaParsed: any;
    let textoRespuestaParaGuardar: string;

    try {
      // Intenta parsear la respuesta como JSON para mensajes interactivos
      respuestaParsed = JSON.parse(respuestaIA);
      textoRespuestaParaGuardar = respuestaParsed.body || "Mensaje interactivo enviado.";
    } catch (e) {
      // Si falla, es una respuesta de texto plano
      respuestaParsed = { type: 'text', body: respuestaIA };
      textoRespuestaParaGuardar = respuestaIA;
    }

    // 7. GUARDAR RESPUESTA
    await supabase.from("mensajes_recibidos").insert({
      whatsapp: from, texto: textoRespuestaParaGuardar, tipo: "bot", business_id: businessId,
    });

    // 8. ACTUALIZAR MEMORIA
    let memory: Awaited<ReturnType<typeof extractMemory>> | null = null;
    
    // Prepara el texto que se usará para actualizar la memoria del contacto
    const assistantReplyForMemory = respuestaParsed.type === 'text' 
      ? respuestaParsed.body 
      : `[Se envió un mensaje interactivo: ${respuestaParsed.type}] ${respuestaParsed.body}`;

    if (contacto) {
      memory = await extractMemory({
        contacto,
        incomingMessage: text,
        assistantReply: assistantReplyForMemory,
      });

      await supabase
        .from("contactos")
        .update({
          resumen: memory.resumen,
          ultimo_tema: memory.ultimo_tema,
          nombre: profileName || memory.nombre || contacto.nombre || null,
          ultima_respuesta: new Date().toISOString(),
        })
        .eq("id", contacto.id);

      console.log("🧠 Memoria actualizada.");
    }

    // 9. ENVIAR WHATSAPP
    let resultadoEnvio;

    if (respuestaParsed.type === 'buttons' && respuestaParsed.buttons) {
      resultadoEnvio = await sendWhatsAppReplyButtons({
        accessToken, phoneNumberId, to: from,
        body: respuestaParsed.body,
        buttons: respuestaParsed.buttons,
      });
    } else if (respuestaParsed.type === 'list' && respuestaParsed.sections) {
      resultadoEnvio = await sendWhatsAppListMessage({
        accessToken, phoneNumberId, to: from,
        body: respuestaParsed.body,
        buttonText: respuestaParsed.button_text,
        sections: respuestaParsed.sections,
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