import Link from "next/link";
import { LayoutDashboard, Users, LogIn } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/login", label: "Login", icon: LogIn },
];

export default function Sidebar() {
  return (
    <aside className="min-h-screen w-64 border-r border-slate-800 bg-[#0b1220] px-5 py-6 text-white">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Sistema
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">CRM Bot</h2>
        <p className="mt-2 text-sm text-slate-400">
          Leads desde WhatsApp con IA
        </p>
      </div>

      <nav className="space-y-2">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}