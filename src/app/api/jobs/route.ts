import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase";
import {
  scrapingQueue,
  scheduleRecurringScrape,
  addScrapePortalJob,
} from "@/lib/queue";
import { getAllPortals } from "@/lib/apify";
import { rateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`jobs:post:${user.id}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const { action, portal, intervalMinutes } = body;

    switch (action) {
      case "start-recurring": {
        const interval = intervalMinutes || 15;
        await scheduleRecurringScrape(interval);
        const duration = Date.now() - start;
        logRequest("POST", "/api/jobs", 200, duration, user.id);
        return NextResponse.json({
          status: "scheduled",
          intervalMinutes: interval,
        });
      }

      case "stop-recurring": {
        const jobs = await scrapingQueue.getJobSchedulers();
        for (const job of jobs) {
          if (job.name === "recurring-scrape-all" && job.id) {
            await scrapingQueue.removeJobScheduler(job.id);
          }
        }
        const duration = Date.now() - start;
        logRequest("POST", "/api/jobs", 200, duration, user.id);
        return NextResponse.json({ status: "stopped" });
      }

      case "scrape-portal": {
        if (!portal) {
          const duration = Date.now() - start;
          logRequest("POST", "/api/jobs", 400, duration, user.id);
          return NextResponse.json(
            { error: "Portal slug is required" },
            { status: 400 }
          );
        }
        const job = await addScrapePortalJob(portal);
        const duration = Date.now() - start;
        logRequest("POST", "/api/jobs", 200, duration, user.id);
        return NextResponse.json({
          jobId: job.id,
          portal,
          status: "queued",
        });
      }

      default:
        const duration = Date.now() - start;
        logRequest("POST", "/api/jobs", 400, duration, user.id);
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("POST", "/api/jobs", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("POST", "/api/jobs", 500, duration);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`jobs:get:${user.id}`, 100, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const jobs = await scrapingQueue.getJobs(
      ["waiting", "active", "completed", "failed"],
      0,
      20
    );

    const schedulers = await scrapingQueue.getJobSchedulers();

    const portals = getAllPortals().map((p) => ({
      name: p.name,
      slug: p.slug,
    }));

    const duration = Date.now() - start;
    logRequest("GET", "/api/jobs", 200, duration, user.id);
    return NextResponse.json({
      jobs: jobs.map((job) => ({
        id: job.id,
        name: job.name,
        data: job.data,
        progress: job.progress,
        status: job.progress ? "completed" : "active",
        timestamp: job.timestamp,
      })),
      schedulers: schedulers.map((s) => ({
        id: s.id,
        name: s.name,
        pattern: s.pattern,
        every: s.every,
      })),
      portals,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("GET", "/api/jobs", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("GET", "/api/jobs", 500, duration);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
