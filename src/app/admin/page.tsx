"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";

interface Stats {
  users: number;
  properties: number;
  subscriptions: number;
  activeSubscriptions: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {}
      setLoading(false);
    }
    fetchStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Panel de administración</h1>
          <p className="text-slate-400 mt-1">Vista general del sistema</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-800/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Usuarios totales", value: stats.users, icon: "👤", color: "text-blue-400" },
              { label: "Propiedades", value: stats.properties, icon: "🏠", color: "text-emerald-400" },
              { label: "Suscripciones", value: stats.subscriptions, icon: "💳", color: "text-purple-400" },
              { label: "Activas", value: stats.activeSubscriptions, icon: "✅", color: "text-green-400" },
            ].map((item) => (
              <div key={item.label} className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-sm text-slate-400">{item.label}</span>
                </div>
                <p className={`text-3xl font-bold ${item.color}`}>
                  {item.value.toLocaleString("es-AR")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 text-center">
            <p className="text-slate-400">No se pudieron cargar las estadísticas</p>
            <p className="text-sm text-slate-500 mt-2">Configurá el endpoint /api/admin/stats para ver datos reales</p>
          </div>
        )}

        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Acciones rápidas</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <a href="/api/health" target="_blank" className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-3 px-4 rounded-xl transition-colors text-center">
              Health Check
            </a>
            <a href="/api/docs" target="_blank" className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-3 px-4 rounded-xl transition-colors text-center">
              API Docs
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
