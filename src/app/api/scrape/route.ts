import { NextRequest, NextResponse } from "next/server";
import { addScrapeUrlJob, scrapingQueue } from "@/lib/queue";
import { detectPortal, getAllPortals } from "@/lib/apify";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const portal = detectPortal(url);
    if (!portal) {
      return NextResponse.json(
        { error: "Portal not supported", supportedPortals: getAllPortals().map(p => p.slug) },
        { status: 400 }
      );
    }

    const job = await addScrapeUrlJob(url);

    return NextResponse.json({
      jobId: job.id,
      portal: portal.name,
      status: "queued",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const portals = getAllPortals().map((p) => ({
    name: p.name,
    slug: p.slug,
    urlPatterns: p.urlPatterns.map((r) => r.source),
  }));

  const recentJobs = await scrapingQueue.getJobs(["completed", "failed", "active"], 0, 10);

  return NextResponse.json({
    portals,
    recentJobs: recentJobs.map((job) => ({
      id: job.id,
      data: job.data,
      progress: job.progress,
      timestamp: job.timestamp,
    })),
  });
}
