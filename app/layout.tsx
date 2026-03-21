"use client";

import "./globals.css";
import Sidebar from "@/components/layout/sidebar";
import { usePathname } from "next/navigation";


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideSidebar = pathname === "/login";

  return (
    <html lang="es">
      <body className="bg-[#f7f5fb] text-slate-900 antialiased">
        <div className="min-h-screen">
          {hideSidebar ? (
            children
          ) : (
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 p-6 md:p-8">
                <div className="mx-auto max-w-7xl">{children}</div>
              </main>
            </div>
          )}
        </div>
      </body>
    </html>
  );
}