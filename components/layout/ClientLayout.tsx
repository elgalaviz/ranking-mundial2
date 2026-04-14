"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const showSidebar = 
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/leads") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/god");

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pt-16 lg:pt-0 p-4 md:p-6 lg:p-8 overflow-x-hidden">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}