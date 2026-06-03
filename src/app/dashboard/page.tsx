"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
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

export default function DashboardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [schedulers, setSchedulers] = useState<Scheduler[]>([]);
  const [portals, setPortals] = useState<Portal[]>([]);
  const [filterCount, setFilterCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState("");

  const [recurringLoading, setRecurringLoading] = useState(false);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [jobsRes, filtersRes] = await Promise.all([
          fetch("/api/jobs"),
          fetch("/api/filters"),
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
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

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
        setScrapeMsg(`Scrape iniciado en ${data.portal} (ID: ${data.jobId})`);
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
        // silent
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
        // silent
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
      // silent
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
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Bienvenido{user?.name ? `, ${user.name}` : ""}
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <p className="text-sm text-slate-400">Propiedades</p>
            <p className="text-3xl font-bold text-white mt-1">{jobs.length}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <p className="text-sm text-slate-400">Alertas activas</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1">{schedulers.length}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <p className="text-sm text-slate-400">Filtros</p>
            <p className="text-3xl font-bold text-white mt-1">{filterCount}</p>
          </div>
        </div>

        {/* Scrape URL */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Scrape URL</h2>
          <form onSubmit={handleScrapeUrl} className="flex gap-3">
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
          <div className="flex items-center justify-between mb-4">
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
          <h2 className="text-lg font-semibold text-white mb-4">Trabajos Recientes</h2>
          {jobs.length === 0 ? (
            <p className="text-sm text-slate-500">No hay trabajos registrados</p>
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
                  {jobs.map((job) => (
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
                        {job.timestamp
                          ? new Date(job.timestamp).toLocaleString("es-AR")
                          : "-"}
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
