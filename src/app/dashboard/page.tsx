"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/lib/auth-context";

interface Job {
  id: string;
  name: string;
  data?: Record<string, unknown>;
  progress?: number;
  status: string;
  timestamp?: string;
}

interface Scheduler {
  id: string;
  name: string;
  pattern?: string;
  every?: number;
}

interface Portal {
  name: string;
  slug: string;
}

interface JobsResponse {
  jobs: Job[];
  schedulers: Scheduler[];
  portals: Portal[];
}

function timeAgo(timestamp?: string): string {
  if (!timestamp) return "-";
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [schedulers, setSchedulers] = useState<Scheduler[]>([]);
  const [portals, setPortals] = useState<Portal[]>([]);
  const [filterCount, setFilterCount] = useState(0);
  const [planName, setPlanName] = useState("Free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState("");

  const [recurringLoading, setRecurringLoading] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const [jobsRes, filtersRes, billingRes] = await Promise.all([
        fetch("/api/jobs"),
        fetch("/api/filters"),
        fetch("/api/billing"),
      ]);

      if (jobsRes.ok) {
        const data: JobsResponse = await jobsRes.json();
        setJobs(data.jobs);
        setSchedulers(data.schedulers);
        setPortals(data.portals);
      }

      if (filtersRes.ok) {
        const data = await filtersRes.json();
        setFilterCount(data.filters?.length ?? 0);
      }

      if (billingRes.ok) {
        const data = await billingRes.json();
        setPlanName(data.plan?.plan ?? data.subscription?.planId ?? "Free");
      }
    } catch {
      setError("Error al cargar los datos. Verificá tu conexión.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function handleScrapeUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    setScrapeMsg("");
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setScrapeMsg(data.error || "Error al scrapear");
      } else {
        setScrapeMsg(`Scrape completado en ${data.portal}: ${data.scraped} encontradas, ${data.new} nuevas`);
        setScrapeUrl("");
      }
    } catch {
      setScrapeMsg("Error de conexion");
    } finally {
      setScraping(false);
    }
  }

  async function handleToggleRecurring() {
    if (schedulers.length > 0) {
      setRecurringLoading(true);
      try {
        await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "stop-recurring" }),
        });
        setSchedulers([]);
      } catch {
        setError("Error al detener scraping recurrente");
      } finally {
        setRecurringLoading(false);
      }
    } else {
      setRecurringLoading(true);
      try {
        const res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start-recurring", intervalMinutes: 60 }),
        });
        const data = await res.json();
        if (data.schedulers) {
          setSchedulers(data.schedulers);
        }
      } catch {
        setError("Error al iniciar scraping recurrente");
      } finally {
        setRecurringLoading(false);
      }
    }
  }

  async function handleScrapePortal(slug: string) {
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scrape-portal", portal: slug }),
      });
      const data = await res.json();
      if (data.job) {
        setJobs((prev) => [data.job, ...prev]);
      }
    } catch {
      setError("Error al iniciar scraping del portal");
    }
  }

  function statusDot(status: string) {
    const base = "w-2.5 h-2.5 rounded-full inline-block";
    switch (status) {
      case "completed":
        return `${base} bg-emerald-400`;
      case "failed":
        return `${base} bg-red-400`;
      case "active":
      case "running":
      case "waiting":
        return `${base} bg-yellow-400`;
      default:
        return `${base} bg-slate-500`;
    }
  }

  const recentJobs = jobs.slice(0, 10);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400">Cargando dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Bienvenido{user?.name ? `, ${user.name}` : ""}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => {
                setError(null);
                fetchData();
              }}
              className="text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M12 13.875V7.5" />
              </svg>
              <p className="text-xs sm:text-sm text-slate-400">Trabajos</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{jobs.length}</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <p className="text-xs sm:text-sm text-slate-400">Alertas activas</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{schedulers.length}</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
              </svg>
              <p className="text-xs sm:text-sm text-slate-400">Filtros guardados</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{filterCount}</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0116.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-5.54 0" />
              </svg>
              <p className="text-xs sm:text-sm text-slate-400">Plan actual</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-amber-400">{planName}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <Link
            href="/properties"
            className="bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-300 hover:text-white font-medium transition-colors"
          >
            Ver propiedades
          </Link>
          <Link
            href="/alerts"
            className="bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-300 hover:text-white font-medium transition-colors"
          >
            Crear filtro
          </Link>
          <Link
            href="/billing"
            className="bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-300 hover:text-white font-medium transition-colors"
          >
            Gestionar facturación
          </Link>
        </div>

        {/* Scrape URL */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Scrape URL</h2>
          <form onSubmit={handleScrapeUrl} className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              placeholder="https://..."
              required
              className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
            />
            <button
              type="submit"
              disabled={scraping}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
            >
              {scraping ? "Scrapeando..." : "Scrapear"}
            </button>
          </form>
          {scrapeMsg && (
            <p className="text-sm text-slate-400 mt-3">{scrapeMsg}</p>
          )}
        </div>

        {/* Scraping Recurring */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-white">Scraping Recurring</h2>
            <button
              onClick={handleToggleRecurring}
              disabled={recurringLoading}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
                schedulers.length > 0
                  ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white"
              } disabled:opacity-50`}
            >
              {recurringLoading
                ? "Procesando..."
                : schedulers.length > 0
                ? "Detener"
                : "Iniciar"}
            </button>
          </div>
          {schedulers.length > 0 ? (
            <div className="space-y-2">
              {schedulers.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 text-sm text-slate-300"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  <span>{s.name}</span>
                  {s.every && (
                    <span className="text-slate-500">
                      cada {s.every >= 60 ? `${s.every / 60}h` : `${s.every}m`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No hay scraping recurrente activo
            </p>
          )}
        </div>

        {/* Portales */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Portales</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {portals.map((p) => (
              <button
                key={p.slug}
                onClick={() => handleScrapePortal(p.slug)}
                className="bg-slate-700/40 hover:bg-slate-700/70 border border-slate-600/50 rounded-xl px-4 py-3 text-sm text-white font-medium transition-colors text-center"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Trabajos Recientes */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Trabajos Recientes</h2>
            {jobs.length > 10 && (
              <Link
                href="/jobs"
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Ver todos
              </Link>
            )}
          </div>
          {recentJobs.length === 0 ? (
            <EmptyState
              icon="📋"
              title="Sin trabajos aún"
              description="Iniciá un scrape desde la sección de Portales o pegá una URL arriba."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 text-slate-400 font-medium">Nombre</th>
                    <th className="text-left py-3 text-slate-400 font-medium">Estado</th>
                    <th className="text-left py-3 text-slate-400 font-medium">Progreso</th>
                    <th className="text-left py-3 text-slate-400 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJobs.map((job) => (
                    <tr key={job.id} className="border-b border-slate-700/50 last:border-0">
                      <td className="py-3 text-white">{job.name}</td>
                      <td className="py-3">
                        <span className="flex items-center gap-2">
                          <span className={statusDot(job.status)} />
                          <span className="text-slate-300 capitalize">{job.status}</span>
                        </span>
                      </td>
                      <td className="py-3 text-slate-300">{job.progress ?? 0}%</td>
                      <td className="py-3 text-slate-500">
                        {timeAgo(job.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
