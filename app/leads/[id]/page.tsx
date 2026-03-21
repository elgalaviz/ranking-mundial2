import Link from "next/link";
import { ArrowLeft, MessageCircle, Phone, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

type Contacto = {
  id: string;
  business_id?: string | null;
  assigned_user_id?: string | null;
  whatsapp: string;
  nombre: string | null;
  resumen: string | null;
  ultimo_tema: string | null;
  necesidad: string | null;
  estado: string | null;
  veces_contacto: number | null;
  ultima_respuesta: string | null;
};

type Mensaje = {
  id: string;
  business_id?: string | null;
  whatsapp: string;
  texto: string | null;
  tipo: "cliente" | "bot" | null;
  created_at: string | null;
};

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 🔥 obtener negocio del usuario
  const { data: businessUser } = await supabase
    .from("business_users")
    .select("business_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!businessUser?.business_id) {
    return <ErrorBox text="Usuario sin negocio asignado." />;
  }

  const businessId = businessUser.business_id;
  const role = businessUser.role || "seller";

  // 🔥 buscar lead SOLO por id (sin filtros agresivos)
  const { data: lead, error } = await supabase
    .from("contactos")
    .select("*")
    .eq("id", id.trim())
    .maybeSingle();

  // 🔥 DEBUG mental: si existe pero no coincide business
  if (lead && lead.business_id !== businessId) {
    return <ErrorBox text="Lead pertenece a otro negocio." />;
  }

  // 🔥 si es vendedor, validar asignación
  if (lead && role !== "admin" && lead.assigned_user_id !== user.id) {
    return <ErrorBox text="No tienes acceso a este lead." />;
  }

  if (!lead || error) {
    return (
      <div className="space-y-6">
        <Link href="/leads" className="text-sm text-slate-600">
          ← Volver
        </Link>

        <div className="rounded-[28px] border p-10 bg-white">
          <h1 className="text-2xl font-bold">Lead no encontrado</h1>
        </div>
      </div>
    );
  }

  const contacto = lead as Contacto;
  const phone = contacto.whatsapp;

  // 🔥 mensajes
  const { data: mensajesData } = await supabase
    .from("mensajes_recibidos")
    .select("*")
    .eq("whatsapp", phone)
    .order("created_at", { ascending: true });

  const mensajes: Mensaje[] = mensajesData || [];

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="rounded-[28px] bg-gradient-to-r from-purple-500 to-pink-500 p-8 text-white">
        <Link href="/leads" className="text-sm opacity-80">
          ← Volver
        </Link>

        <h1 className="text-3xl font-bold mt-2">
          {contacto.nombre || "Sin nombre"}
        </h1>

        <div className="flex gap-3 mt-4 text-sm">
          <span>{contacto.estado}</span>
          <span>{phone}</span>
        </div>
      </div>

      {/* GRID */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Resumen">{contacto.resumen}</Card>

          <div className="grid grid-cols-2 gap-4">
            <Card title="Tema">{contacto.ultimo_tema}</Card>
            <Card title="Necesidad">{contacto.necesidad}</Card>
          </div>

          {/* CHAT */}
          <div className="bg-white p-6 rounded-2xl border">
            <h2 className="font-semibold">Conversación</h2>

            <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
              {mensajes.map((msg) => {
                const isBot = msg.tipo === "bot";

                return (
                  <div
                    key={msg.id}
                    className={`flex ${
                      isBot ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-2 rounded-xl text-sm max-w-[70%] ${
                        isBot
                          ? "bg-purple-500 text-white"
                          : "bg-gray-100 text-black"
                      }`}
                    >
                      {msg.texto}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <Card title="Información">
            <p>WhatsApp: {phone}</p>
            <p>Estado: {contacto.estado}</p>
            <p>Contactos: {contacto.veces_contacto}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* COMPONENTES */

function Card({
  title,
  children,
}: {
  title: string;
  children: any;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-3 text-sm">{children || "-"}</div>
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="p-10 bg-white rounded-2xl border">
      <h1 className="text-xl font-bold text-red-500">{text}</h1>
    </div>
  );
}