import "./globals.css";
import { Metadata } from "next";
import ClientLayout from "@/components/layout/ClientLayout";

export const metadata: Metadata = {
  title: "Prospekto",
  description: "SaaS que automatiza respuestas con IA y organiza leads para equipos de ventas",
  manifest: "/manifest.json",
  icons: {
    icon: "/Prospekt-icono.ico",
    shortcut: "/Prospekt-icono.ico",
    apple: "/Prospekt-app.png",
  },
  themeColor: "#8c7ac6",
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