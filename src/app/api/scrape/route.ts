import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase";
import { addScrapeUrlJob, scrapingQueue } from "@/lib/queue";
import { detectPortal, getAllPortals } from "@/lib/apify";
import { rateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`scrape:post:${user.id}`, 5, 3_600_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      const duration = Date.now() - start;
      logRequest("POST", "/api/scrape", 400, duration, user.id);
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const portal = detectPortal(url);
    if (!portal) {
      const duration = Date.now() - start;
      logRequest("POST", "/api/scrape", 400, duration, user.id);
      return NextResponse.json(
        { error: "Portal not supported", supportedPortals: getAllPortals().map(p => p.slug) },
        { status: 400 }
      );
    }

    const job = await addScrapeUrlJob(url);

    const duration = Date.now() - start;
    logRequest("POST", "/api/scrape", 200, duration, user.id);
    return NextResponse.json({
      jobId: job.id,
      portal: portal.name,
      status: "queued",
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("POST", "/api/scrape", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("POST", "/api/scrape", 500, duration);
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
    const rl = rateLimit(`scrape:get:${user.id}`, 100, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const portals = getAllPortals().map((p) => ({
      name: p.name,
      slug: p.slug,
      urlPatterns: p.urlPatterns.map((r) => r.source),
    }));

    const recentJobs = await scrapingQueue.getJobs(["completed", "failed", "active"], 0, 10);

    const duration = Date.now() - start;
    logRequest("GET", "/api/scrape", 200, duration, user.id);
    return NextResponse.json({
      portals,
      recentJobs: recentJobs.map((job) => ({
        id: job.id,
        data: job.data,
        progress: job.progress,
        timestamp: job.timestamp,
      })),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("GET", "/api/scrape", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("GET", "/api/scrape", 500, duration);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
