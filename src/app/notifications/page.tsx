"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { EmptyState } from "@/components/empty-state";

interface Notification {
  id: string;
  propertyId: string;
  filterId: string;
  filterName: string;
  userId: string;
  status: string;
  error: string | null;
  sentAt: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications", {
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = "/login";
            return;
          }
          setError("Error al cargar notificaciones");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch {
        setError("Error al cargar notificaciones");
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Notificaciones</h1>
          <p className="text-slate-400 mt-1">Alertas y actualizaciones de tus búsquedas</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300 text-sm">
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="bell"
            title="Sin notificaciones"
            description="Cuando haya nuevas propiedades que coincidan con tus filtros, aparecerán acá."
          />
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700 flex items-start gap-3"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    notif.status === "sent"
                      ? "bg-emerald-500/20"
                      : notif.status === "failed"
                      ? "bg-red-500/20"
                      : "bg-slate-600/30"
                  }`}
                >
                  {notif.status === "sent" ? (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : notif.status === "failed" ? (
                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {notif.filterName}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {notif.status === "sent"
                      ? "Enviada"
                      : notif.status === "failed"
                      ? `Error: ${notif.error || "No enviada"}`
                      : "Pendiente"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(notif.createdAt).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
