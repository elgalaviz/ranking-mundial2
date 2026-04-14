import "./globals.css";
import { Metadata } from "next";
import ClientLayout from "@/components/layout/ClientLayout";

const BASE_URL = "https://prospekto.mx";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  // ── Títulos ──────────────────────────────────────────────────────
  title: {
    default: "Prospekto — CRM + Bot WhatsApp con IA para PyMEs",
    template: "%s | Prospekto",
  },

  // ── Descripción ──────────────────────────────────────────────────
  description:
    "Prospekto responde automáticamente cada mensaje de WhatsApp, califica el interés del cliente, organiza tus leads y los asigna a tu equipo de ventas. CRM con IA para PyMEs mexicanas. Desde $0.38 USD/mes.",

  // ── Keywords ─────────────────────────────────────────────────────
  keywords: [
    "CRM WhatsApp",
    "bot WhatsApp con IA",
    "automatizar WhatsApp ventas",
    "CRM para PyMEs México",
    "respuestas automáticas WhatsApp",
    "asistente ventas WhatsApp",
    "gestión de leads WhatsApp",
    "software CRM México",
    "bot ventas WhatsApp Business",
    "automatización ventas pymes",
    "CRM leads WhatsApp",
    "prospekto",
  ],

  // ── Autores / Categoría ──────────────────────────────────────────
  authors: [{ name: "Prospekto", url: BASE_URL }],
  category: "software",
  applicationName: "Prospekto",

  // ── Canonical ────────────────────────────────────────────────────
  alternates: {
    canonical: "/",
    languages: { "es-MX": "/" },
  },

  // ── Open Graph ───────────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: BASE_URL,
    siteName: "Prospekto",
    title: "Prospekto — CRM + Bot WhatsApp con IA para PyMEs",
    description:
      "Responde cada mensaje de WhatsApp al instante con IA, califica leads y los asigna automáticamente a tu equipo de ventas. Empieza gratis.",
    images: [
      {
        url: "/Prospekt-app.png",
        width: 1200,
        height: 630,
        alt: "Prospekto — CRM con bot WhatsApp para PyMEs",
      },
    ],
  },

  // ── Twitter / X ──────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "Prospekto — CRM + Bot WhatsApp con IA para PyMEs",
    description:
      "Responde cada mensaje de WhatsApp al instante con IA. Califica leads, asígnalos a tu equipo y cierra más ventas. Desde $0.38 USD/mes.",
    images: ["/Prospekt-app.png"],
  },

  // ── Robots ───────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── PWA / Icons ──────────────────────────────────────────────────
  manifest: "/manifest.json",
  icons: {
    icon: "/Prospekt-icono.ico",
    shortcut: "/Prospekt-icono.ico",
    apple: "/Prospekt-app.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Prospekto",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#8c7ac6" />
      </head>
      <body className="bg-[#f7f5fb] text-slate-900 antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}