import "./globals.css";
import { Metadata } from "next";
import ClientLayout from "@/components/layout/ClientLayout";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.mifanbot.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  // ── Títulos ──────────────────────────────────────────────────────
  title: {
    default: "MiFanBot — Alertas del Mundial 2026 gratis por WhatsApp",
    template: "%s | MiFanBot",
  },

  // ── Descripción ──────────────────────────────────────────────────
  description:
    "Recibe alertas de partidos del Mundial 2026 por WhatsApp 15 minutos antes. Quiniela gratis, chatbot de fútbol con IA. Sin app, sin registro. Solo WhatsApp.",

  // ── Keywords ─────────────────────────────────────────────────────
  keywords: [
    "MiFanBot",
    "alertas Mundial 2026 WhatsApp",
    "bot WhatsApp Mundial 2026",
    "quiniela Mundial 2026 gratis",
    "chatbot fútbol WhatsApp",
    "alertas partidos WhatsApp",
    "Mundial 2026",
    "Copa del Mundo 2026",
    "calendario Mundial 2026",
    "fanbot mundial",
    "bot fútbol gratis",
    "notificaciones fútbol WhatsApp",
  ],

  // ── Autores / Categoría ──────────────────────────────────────────
  authors: [{ name: "MiFanBot", url: "https://www.mifanbot.com" }],
  category: "sports",
  applicationName: "MiFanBot",

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
    siteName: "MiFanBot",
    title: "MiFanBot — Alertas del Mundial 2026 gratis por WhatsApp",
    description:
      "Alertas 15 min antes de cada partido, quiniela gratis y chatbot de fútbol con IA. Todo por WhatsApp. Sin app, sin registro.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MiFanBot — Alertas del Mundial 2026 por WhatsApp",
      },
    ],
  },

  // ── Twitter / X ──────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "MiFanBot — Alertas del Mundial 2026 gratis por WhatsApp",
    description:
      "Alertas 15 min antes de cada partido, quiniela gratis y chatbot de fútbol con IA. Todo por WhatsApp.",
    images: ["/og-image.png"],
  },

  // ── Robots ───────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
  },

  // ── Verificación ─────────────────────────────────────────────────
  verification: {
    other: {
      "facebook-domain-verification": ["mgobguy3092h6pyec2l05lycd321an"],
    },
  },

  // ── Icons ────────────────────────────────────────────────────────
  icons: {
    icon: "/favicon.ico",
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
