import "./globals.css";
import Sidebar from "@/components/layout/sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#f5f7fb] text-black antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-6 md:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}