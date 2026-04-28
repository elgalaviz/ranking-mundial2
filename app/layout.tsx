import "./globals.css";
import { Metadata } from "next";
import Script from "next/script";
import ClientLayout from "@/components/layout/ClientLayout";

const rawUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.mifanbot.com";
const BASE_URL = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  // ── Títulos ──────────────────────────────────────────────────────
  title: {
    default: "MiFanBot — Información y Alertas del Mundial 2026 gratis por WhatsApp",
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
    title: "MiFanBot — Información y Alertas del Mundial 2026 gratis por WhatsApp",
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
    title: "MiFanBot — Información y Alertas del Mundial 2026 gratis por WhatsApp",
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

  // ── Facebook ─────────────────────────────────────────────────────
  other: {
    "fb:app_id": "1682649832859575",
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
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PG7M3LPP"
            height="0" width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <ClientLayout>{children}</ClientLayout>
        {/* Google Tag Manager */}
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PG7M3LPP');`}
        </Script>
      </body>
    </html>
  );
}
