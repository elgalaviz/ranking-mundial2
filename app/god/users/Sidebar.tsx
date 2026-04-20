"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Trophy,
  Swords,
  LogOut,
  User,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/god/dashboard", icon: LayoutDashboard },
  { name: "Usuarios", href: "/god/users", icon: Users },
  { name: "Partidos", href: "/god/partidos", icon: Calendar },
  { name: "Quiniela", href: "/god/quiniela", icon: Trophy },
  { name: "Fantasy", href: "/god/fantasy", icon: Swords },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm">
      <div className="flex items-center justify-center h-20 border-b border-gray-200">
        <Link href="/" className="text-xl font-bold text-gray-800">
          Mundial26 <span className="text-[#006847]">Admin</span>
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
                  ? "text-gray-600"
                  : "text-gray-400 group-hover:text-gray-500",
                "mr-3 flex-shrink-0 h-5 w-5"
              )}
              aria-hidden="true"
            />
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 truncate">{user.email}</p>
            <p className="text-xs text-gray-500">Super Admin</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}