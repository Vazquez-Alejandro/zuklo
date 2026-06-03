"use client";

import { useState, useEffect } from "react";

interface Job {
  id: string;
  name: string;
  data: Record<string, unknown>;
  progress: Record<string, unknown>;
  status: string;
  timestamp: number;
}

interface ScrapeResponse {
  jobId: string;
  portal: string;
  status: string;
}

interface JobsResponse {
  jobs: Job[];
  schedulers: { id: string; name: string; pattern: string; every: number }[];
  portals: { name: string; slug: string }[];
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResponse | null>(null);
  const [error, setError] = useState("");
  const [jobsData, setJobsData] = useState<JobsResponse | null>(null);
  const [recurringActive, setRecurringActive] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobsData(data);
      setRecurringActive(data.schedulers?.some((s: { name: string }) => s.name === "recurring-scrape-all"));
    } catch {
      console.error("Failed to fetch jobs");
    }
  }

  async function handleScrape() {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setResult(data);
      setUrl("");
      fetchJobs();
    } catch {
      setError("Failed to submit scraping job");
    } finally {
      setLoading(false);
    }
  }

  async function toggleRecurring() {
    try {
      if (recurringActive) {
        await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "stop-recurring" }),
        });
        setRecurringActive(false);
      } else {
        await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start-recurring", intervalMinutes: 15 }),
        });
        setRecurringActive(true);
      }
      fetchJobs();
    } catch {
      console.error("Failed to toggle recurring");
    }
  }

  async function scrapePortal(slug: string) {
    try {
      await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scrape-portal", portal: slug }),
      });
      fetchJobs();
    } catch {
      console.error("Failed to start portal scrape");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-emerald-400">Zuklo</span> Scraper
          </h1>
          <p className="text-slate-400">
            Automated rental property scraping and indexing
          </p>
        </div>

        {/* URL Input */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">Scrape URL</h2>
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.zillow.com/homes/..."
              className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleScrape()}
            />
            <button
              onClick={handleScrape}
              disabled={loading || !url.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              {loading ? "Scraping..." : "Scrape"}
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-3 text-emerald-300 text-sm">
              Job #{result.jobId} queued for {result.portal}
            </div>
          )}
        </div>

        {/* Recurring Scraping */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Recurring Scraping</h2>
              <p className="text-slate-400 text-sm">
                Automatically scrape all portals every 15 minutes
              </p>
            </div>
            <button
              onClick={toggleRecurring}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                recurringActive
                  ? "bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/50"
                  : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/50"
              }`}
            >
              {recurringActive ? "Stop" : "Start"} Recurring
            </button>
          </div>
          {jobsData?.schedulers && jobsData.schedulers.length > 0 && (
            <div className="mt-4 text-sm text-slate-400">
              Active schedulers: {jobsData.schedulers.map(s => s.name).join(", ")}
            </div>
          )}
        </div>

        {/* Portals */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">Portals</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {jobsData?.portals?.map((portal) => (
              <button
                key={portal.slug}
                onClick={() => scrapePortal(portal.slug)}
                className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl p-3 text-sm font-medium transition-colors"
              >
                {portal.name}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">Recent Jobs</h2>
          {jobsData?.jobs && jobsData.jobs.length > 0 ? (
            <div className="space-y-2">
              {jobsData.jobs.slice(0, 10).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between bg-slate-700/30 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        job.status === "completed"
                          ? "bg-emerald-400"
                          : job.status === "failed"
                          ? "bg-red-400"
                          : "bg-amber-400"
                      }`}
                    />
                    <span className="text-sm font-medium">
                      {job.name || "scrape"}
                    </span>
                    <span className="text-xs text-slate-400">
                      #{job.id}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(job.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No jobs yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
