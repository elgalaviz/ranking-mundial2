import "./globals.css";
import { Metadata } from "next";
import ClientLayout from "@/components/layout/ClientLayout";

const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  // ── Títulos ──────────────────────────────────────────────────────
  title: {
    default: "Ranking Mundial 26 — Alertas y Chatbot de WhatsApp",
    template: "%s | Ranking Mundial 26",
  },

  // ── Descripción ──────────────────────────────────────────────────
  description:
    "Recibe alertas de partidos del Mundial 2026 15 minutos antes de que empiecen, y pregunta lo que quieras a nuestro FanBot de IA. Todo por WhatsApp, gratis y sin apps.",

  // ── Keywords ─────────────────────────────────────────────────────
  keywords: [
    "Mundial 2026",
    "alertas WhatsApp",
    "bot WhatsApp",
    "chatbot Mundial",
    "calendario Mundial 2026",
    "partidos Mundial 2026",
    "Copa del Mundo 2026",
    "FanBot",
    "notificaciones fútbol",
    "WhatsApp API",
  ],

  // ── Autores / Categoría ──────────────────────────────────────────
  authors: [{ name: "Ranking Agencia", url: "https://rankingagencia.com" }],
  category: "sports",
  applicationName: "Ranking Mundial 26",

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
    siteName: "Ranking Mundial 26",
    title: "Ranking Mundial 26 — Alertas y Chatbot de WhatsApp",
    description:
      "Recibe alertas de partidos 15 minutos antes, y pregunta lo que quieras a nuestro FanBot de IA. Todo por WhatsApp.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ranking Mundial 26 — Alertas de WhatsApp",
      },
    ],
  },

  // ── Twitter / X ──────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "Ranking Mundial 26 — Alertas y Chatbot de WhatsApp",
    description:
      "Recibe alertas de partidos 15 minutos antes, y pregunta lo que quieras a nuestro FanBot de IA. Todo por WhatsApp.",
    images: ["/og-image.png"],
  },

  // ── Robots ───────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
  },

  // ── PWA / Icons ──────────────────────────────────────────────────
  // manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    // shortcut: "/shortcut-icon.png",
    // apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-white text-gray-900 antialiased" suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
