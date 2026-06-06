import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase";
import { scrapePortal, getAllPortals } from "@/lib/apify";
import { deduplicateProperties, generatePropertyHash } from "@/lib/dedup";
import { db } from "@/lib/db";
import { properties } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
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
    const { action, portal } = body;

    if (action === "scrape-portal") {
      if (!portal) {
        const duration = Date.now() - start;
        logRequest("POST", "/api/jobs", 400, duration, user.id);
        return NextResponse.json(
          { error: "Portal slug is required" },
          { status: 400 }
        );
      }

      const scraped = await scrapePortal(portal, 50);
      const newProperties = deduplicateProperties(scraped);

      let savedCount = 0;
      for (const prop of newProperties) {
        const existing = await db.select().from(properties)
          .where(eq(properties.portalId, prop.portalId))
          .limit(1);

        if (existing.length === 0) {
          const contentHash = generatePropertyHash(prop);
          await db.insert(properties).values({
            portal: prop.portal,
            portalId: prop.portalId,
            url: prop.url,
            title: prop.title,
            description: prop.description || "",
            price: String(prop.price),
            currency: prop.currency || "ARS",
            address: prop.location?.address || "",
            city: prop.location?.city || "",
            state: prop.location?.state || "",
            country: prop.location?.country || "AR",
            zip: prop.location?.zip || "",
            lat: prop.location?.lat,
            lng: prop.location?.lng,
            bedrooms: prop.features?.bedrooms || 0,
            bathrooms: prop.features?.bathrooms || 0,
            area: String(prop.features?.area || 0),
            areaUnit: prop.features?.areaUnit || "m2",
            parkingSpaces: prop.features?.parkingSpaces || 0,
            furnished: prop.features?.furnished,
            petFriendly: prop.features?.petFriendly,
            images: prop.images || [],
            mainImage: prop.images?.[0] || null,
            publishedAt: prop.publishedAt ? new Date(prop.publishedAt) : null,
            contentHash,
          });
          savedCount++;
        }
      }

      const duration = Date.now() - start;
      logRequest("POST", "/api/jobs", 200, duration, user.id);
      return NextResponse.json({
        portal,
        scraped: scraped.length,
        new: savedCount,
        status: "completed",
      });
    }

    const duration = Date.now() - start;
    logRequest("POST", "/api/jobs", 400, duration, user.id);
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("POST", "/api/jobs", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("POST", "/api/jobs", 500, duration);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
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

    const recentProperties = await db.select().from(properties)
      .orderBy(desc(properties.createdAt))
      .limit(20);

    const portals = getAllPortals().map((p) => ({
      name: p.name,
      slug: p.slug,
    }));

    const portalCounts: Record<string, number> = {};
    for (const p of recentProperties) {
      portalCounts[p.portal] = (portalCounts[p.portal] || 0) + 1;
    }

    const duration = Date.now() - start;
    logRequest("GET", "/api/jobs", 200, duration, user.id);
    return NextResponse.json({
      jobs: recentProperties.map((p) => ({
        id: p.id,
        name: `${p.portal}: ${p.title}`,
        data: { url: p.url, price: p.price, city: p.city },
        progress: 100,
        status: "completed",
        timestamp: p.createdAt?.toISOString(),
      })),
      schedulers: [],
      portals,
      propertyCount: recentProperties.length,
      portalCounts,
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
