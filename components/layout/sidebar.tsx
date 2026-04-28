"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Bot, MessageSquare, LogOut } from "lucide-react";

const navigation = [
  { name: "Config Bot", href: "/admin/bot", icon: Bot },
  { name: "WhatsApp", href: "/admin/whatsapp", icon: MessageSquare },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Sidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <>
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 lg:hidden">
        <Link href="/">
          <Image src="/mifanbot-h.svg" alt="MiFanBot" width={110} height={28} />
        </Link>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm min-h-screen">
        <div className="flex items-center justify-center h-20 border-b border-gray-200">
          <Link href="/">
            <Image src="/mifanbot-h.svg" alt="MiFanBot" width={130} height={34} priority />
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={classNames(
                pathname.startsWith(item.href)
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
              )}
            >
              <item.icon
                className={classNames(
                  pathname.startsWith(item.href)
                    ? "text-[#006847]"
                    : "text-gray-400 group-hover:text-gray-500",
                  "mr-3 shrink-0 h-5 w-5"
                )}
              />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </>
  );
}
