import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
const verifyToken = process.env.VERIFY_TOKEN;
const whatsappToken = process.env.WHATSAPP_TOKEN;
const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

if (!supabaseUrl) {
  throw new Error('Falta SUPABASE_URL en variables de entorno');
}

if (!supabaseKey) {
  throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en variables de entorno');
}

if (!openaiKey) {
  throw new Error('Falta OPENAI_API_KEY en variables de entorno');
}

if (!verifyToken) {
  throw new Error('Falta VERIFY_TOKEN en variables de entorno');
}

if (!whatsappToken) {
  throw new Error('Falta WHATSAPP_TOKEN en variables de entorno');
}

if (!whatsappPhoneNumberId) {
  throw new Error('Falta WHATSAPP_PHONE_NUMBER_ID en variables de entorno');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({
  apiKey: openaiKey,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === verifyToken) {
    return new Response(challenge || '', { status: 200 });
  }

  return new Response('Error de validación', { status: 403 });
}

export async function POST(request: Request) {
  try {
    let body: any;

    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parseando body JSON:', parseError);
      return NextResponse.json(
        { error: 'JSON inválido en el body del request' },
        { status: 400 }
      );
    }

    console.log('1. Body recibido:', JSON.stringify(body, null, 2));

    const value = body.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return NextResponse.json({ status: 'ignored' });
    }

    if (!message.text?.body) {
      return NextResponse.json({
        status: 'ignored_non_text',
        detectedType: message.type || 'unknown',
      });
    }

    const phone = message.from;
    const text = message.text.body || '';
    const clientName = value?.contacts?.[0]?.profile?.name || 'Cliente';

    console.log('2. Phone:', phone);
    console.log('3. Text:', text);

    let { data: contact, error: contactError } = await supabase
      .from('contactos')
      .select('*')
      .eq('whatsapp', phone)
      .maybeSingle();

    console.log('4. Contact antes de IA:', contact);

    if (contactError) {
      return NextResponse.json({ error: contactError.message }, { status: 500 });
    }

    if (!contact) {
      const { data: newContact, error: insertError } = await supabase
        .from('contactos')
        .insert([
          {
            whatsapp: phone,
            nombre: clientName,
            ultimo_tema: text,
            veces_contacto: 1,
            estado: 'Nuevo',
          },
        ])
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      contact = newContact;
    } else {
      const { error: updateError } = await supabase
        .from('contactos')
        .update({
          nombre: clientName || contact.nombre,
          ultimo_tema: text,
          veces_contacto: (contact.veces_contacto || 0) + 1,
        })
        .eq('whatsapp', phone);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      const { data: refreshedContact, error: refreshError } = await supabase
        .from('contactos')
        .select('*')
        .eq('whatsapp', phone)
        .maybeSingle();

      if (refreshError) {
        return NextResponse.json({ error: refreshError.message }, { status: 500 });
      }

      contact = refreshedContact;
    }

    const classificationPrompt = `
Analiza el mensaje del cliente y devuelve únicamente un JSON válido con esta estructura exacta:

{
  "resumen": "",
  "ultimo_tema": "",
  "necesidad": "",
  "estado": ""
}

Reglas:
- "estado" solo puede ser uno de estos valores: "Interesado", "Evaluando", "Cliente"
- "resumen" debe ser breve, claro y útil para CRM
- "ultimo_tema" debe resumir el tema principal del mensaje
- "necesidad" debe describir qué busca resolver o conseguir el cliente
- No agregues texto antes ni después
- No uses markdown
- Devuelve solo JSON puro

Contexto previo del cliente:
- Resumen previo: ${contact?.resumen || 'Sin historial'}
- Último tema previo: ${contact?.ultimo_tema || 'Sin historial'}
- Necesidad previa: ${contact?.necesidad || 'Sin historial'}
- Estado previo: ${contact?.estado || 'Sin historial'}

Mensaje nuevo del cliente:
"${text}"
`;

    const classification = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: classificationPrompt,
        },
      ],
    });

    console.log(
      '5. Respuesta cruda clasificación:',
      classification.choices[0]?.message?.content
    );

    let parsed: {
      resumen?: string;
      ultimo_tema?: string;
      necesidad?: string;
      estado?: 'Interesado' | 'Evaluando' | 'Cliente';
    } = {};

    try {
      parsed = JSON.parse(classification.choices[0]?.message?.content || '{}');
    } catch (parseError) {
      console.error('Error parsing JSON de OpenAI:', parseError);
      parsed = {};
    }

    console.log('6. JSON parseado:', parsed);

    const estadoValido =
      parsed.estado === 'Interesado' ||
      parsed.estado === 'Evaluando' ||
      parsed.estado === 'Cliente'
        ? parsed.estado
        : contact?.estado === 'Interesado' ||
          contact?.estado === 'Evaluando' ||
          contact?.estado === 'Cliente'
        ? contact.estado
        : 'Interesado';

    const { data: updatedContact, error: memoryUpdateError } = await supabase
      .from('contactos')
      .update({
        resumen: parsed.resumen || contact?.resumen || null,
        ultimo_tema: parsed.ultimo_tema || text.substring(0, 100),
        necesidad: parsed.necesidad || contact?.necesidad || null,
        estado: estadoValido,
      })
      .eq('whatsapp', phone)
      .select()
      .single();

    console.log('7. Contact actualizado:', updatedContact);
    console.log('8. Error update memoria:', memoryUpdateError);

    if (memoryUpdateError) {
      return NextResponse.json({ error: memoryUpdateError.message }, { status: 500 });
    }

    const vecesContacto = updatedContact?.veces_contacto || contact?.veces_contacto || 1;
    const resumenPrevio = updatedContact?.resumen || parsed.resumen || '';
    const necesidadDetectada = updatedContact?.necesidad || parsed.necesidad || '';
    const ultimoTema = updatedContact?.ultimo_tema || parsed.ultimo_tema || text;

    const replyPrompt = `
Eres un bot con IA de atención comercial para servicios de marketing digital y generación de clientes.
Debes sonar humano, claro, directo y útil. No suenes robótico.

IMPORTANTE:
- Debes aclarar casualmente, de forma breve y natural, que eres un bot con IA.
- Ofrece el servicio de forma casual, no forzada.
- Responde en español.
- Máximo 90 palabras.
- No uses markdown.
- No uses emojis.
- No inventes datos.
- No uses frases suaves tipo "si quieres", "podrías", "tal vez", "cuando gustes".
- Debes empujar el avance comercial con seguridad.

CONTEXTO DEL CLIENTE:
- Veces de contacto: ${vecesContacto}
- Resumen previo: ${resumenPrevio || 'Sin historial'}
- Último tema: ${ultimoTema || 'Sin tema'}
- Necesidad detectada: ${necesidadDetectada || 'Sin necesidad detectada'}
- Estado: ${estadoValido}
- Nombre actual detectado: ${updatedContact?.nombre || clientName || 'No detectado'}
- Mensaje nuevo: "${text}"

ESTRATEGIA OBLIGATORIA SEGÚN VECES DE CONTACTO:

1) Si Veces de contacto es 1:
- Identifica rápido la necesidad.
- Haz una pregunta directa para avanzar.
- No des demasiada explicación.

2) Si Veces de contacto es 2:
- Da una recomendación clara y concreta.
- Sin rodeos.
- Debe sentirse como orientación profesional breve.

3) Si Veces de contacto es 3:
- Propón una solución concreta.
- Menciona el resultado esperado: más leads, ventas, visibilidad o mejor captación, según aplique.

4) Si Veces de contacto es 4 o más:
- CIERRE OBLIGATORIO.
- Pide datos clave de forma directa, sin pedir permiso.
- Debes pedir datos como:
  - nombre
  - negocio
  - ciudad
  - si seguimos por llamada o por aquí
- Usa frases seguras como:
  - "Para avanzarte bien, dime..."
  - "Necesito este dato para proponerte algo real..."
  - "Con eso te armo una estrategia clara..."
- No suavices el cierre.

REGLA EXTRA:
- Revisa el resumen previo y el contexto.
- Si el cliente ya dio datos como nombre, negocio o ciudad, confirma avance.
- En ese caso di que prepararás propuesta o que pasarán a llamada.
- Debe sentirse como que ya van avanzando, no como si empezaras desde cero.

ESTILO:
- Directo
- comercial
- claro
- confiado
- conversacional
- breve

Devuelve solo el texto final que se enviará al cliente.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: replyPrompt,
        },
        {
          role: 'user',
          content: text,
        },
      ],
    });

    console.log(
      '9. Respuesta cruda reply:',
      response.choices[0]?.message?.content
    );

    const reply =
      response.choices[0]?.message?.content || 'Soy el bot con IA del equipo. Para avanzarte bien, dime a qué se dedica tu negocio y en qué ciudad estás.';

    const { error: replySaveError } = await supabase
      .from('contactos')
      .update({
        ultima_respuesta: reply,
      })
      .eq('whatsapp', phone);

    if (replySaveError) {
      console.error('10. Error guardando ultima_respuesta:', replySaveError);
    }

    const metaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: reply },
        }),
      }
    );

    const metaResult = await metaResponse.json();

    console.log('11. Respuesta Meta:', metaResult);

    if (!metaResponse.ok) {
      return NextResponse.json(
        {
          error: 'Error enviando mensaje a WhatsApp',
          meta: metaResult,
          reply,
          contact: updatedContact,
          ai: parsed,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      reply,
      contact: updatedContact,
      ai: parsed,
      meta: metaResult,
    });
  } catch (error) {
    console.error('Error general en POST:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message,
          stack: error.stack,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}