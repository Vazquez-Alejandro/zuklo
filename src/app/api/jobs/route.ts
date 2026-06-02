import { NextRequest, NextResponse } from "next/server";
import {
  scrapingQueue,
  scheduleRecurringScrape,
  addScrapePortalJob,
} from "@/lib/queue";
import { getAllPortals } from "@/lib/apify";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, portal, intervalMinutes } = body;

    switch (action) {
      case "start-recurring": {
        const interval = intervalMinutes || 15;
        await scheduleRecurringScrape(interval);
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
        return NextResponse.json({ status: "stopped" });
      }

      case "scrape-portal": {
        if (!portal) {
          return NextResponse.json(
            { error: "Portal slug is required" },
            { status: 400 }
          );
        }
        const job = await addScrapePortalJob(portal);
        return NextResponse.json({
          jobId: job.id,
          portal,
          status: "queued",
        });
      }

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
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
}
