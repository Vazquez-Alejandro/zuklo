"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/properties", label: "Propiedades", icon: "🏠" },
  { href: "/alerts", label: "Alertas", icon: "🔔" },
  { href: "/notifications", label: "Notificaciones", icon: "📨" },
  { href: "/contracts", label: "Contratos", icon: "📄" },
  { href: "/maintenance", label: "Mantenimiento", icon: "🔧" },
  { href: "/billing", label: "Facturacion", icon: "💳" },
  { href: "/profile", label: "Perfil", icon: "👤" },
  { href: "/settings", label: "Configuracion", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const navContent = (
    <>
      <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-700/50">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
          Z
        </div>
        <span className="text-lg font-semibold text-white tracking-tight">
          Zuklo
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.href)
                ? "bg-slate-700/80 text-white"
                : "text-slate-300 hover:bg-slate-700/40 hover:text-white"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700/50">
        <div className="px-3 pb-3">
          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700/40 hover:text-white transition-colors cursor-pointer"
        >
          <span className="text-base">🚪</span>
          Cerrar sesion
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors cursor-pointer"
        aria-label="Abrir menu"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
              Z
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">
              Zuklo
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Cerrar menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-slate-900 border-r border-slate-700/50 h-screen sticky top-0">
        {navContent}
      </aside>
    </>
  );
}
