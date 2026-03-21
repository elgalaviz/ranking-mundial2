"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Bot } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="min-h-screen w-72 border-r border-white/10 bg-[#2f2944] px-5 py-6 text-white shadow-[0_10px_40px_rgba(53,37,78,0.22)]">
      <div className="flex h-full flex-col">
        <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(140,122,198,0.30)_0%,rgba(200,79,146,0.22)_100%)] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
              <Bot size={22} className="text-white" />
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/60">
                Sistema
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
                Ranking CRM
              </h2>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-white/75">
            Leads desde WhatsApp con IA, seguimiento comercial y control de conversaciones.
          </p>
        </div>

        <nav className="mt-8 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] text-white shadow-[0_10px_25px_rgba(200,79,146,0.24)]"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "bg-white/5 text-white/75 group-hover:bg-white/10 group-hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                </span>

                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">
            Estado
          </p>
          <p className="mt-3 text-sm font-medium text-white">
            Panel activo
          </p>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Tu CRM está listo para revisar leads, conversaciones y seguimiento.
          </p>
        </div>
      </div>
    </aside>
  );
}