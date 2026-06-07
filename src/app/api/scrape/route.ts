import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { scrapeUrl, detectPortal, getAllPortals } from "@/lib/apify";
import { scrapeWithCheerio } from "@/lib/scraper";
import { deduplicateProperties, generatePropertyHash } from "@/lib/dedup";
import { db } from "@/lib/db";
import { properties } from "@/lib/schema";
import { eq } from "drizzle-orm";
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

    let scraped: { portal: string; portalId: string; url: string; title: string; description?: string; price: number | string; currency: string; location?: { address?: string; city?: string; state?: string; country?: string; zip?: string; lat?: number; lng?: number }; features?: { bedrooms?: number; bathrooms?: number; area?: number; areaUnit?: string; parkingSpaces?: number }; images?: string[]; publishedAt?: string }[] = [];
    let scrapeSource = "apify";

    try {
      scraped = await scrapeUrl(url);
    } catch {
      try {
        const cheerioResults = await scrapeWithCheerio(url);
        scraped = cheerioResults.map((r) => ({
          ...r,
          price: r.price,
          location: { address: r.address, city: r.city, state: r.state, country: "AR" },
          features: { bedrooms: r.bedrooms, bathrooms: r.bathrooms, area: parseInt(r.area) || 0, areaUnit: "m2" },
        }));
        scrapeSource = "cheerio";
      } catch {
        return NextResponse.json(
          { error: "No se pudo scrapeo la URL. Intentá con otra URL.", status: "failed" },
          { status: 422 }
        );
      }
    }

    const newProperties = deduplicateProperties(scraped as any);

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
    logRequest("POST", "/api/scrape", 200, duration, user.id);
    return NextResponse.json({
      portal: portal.name,
      scraped: scraped.length,
      new: savedCount,
      duplicates: scraped.length - savedCount,
      status: "completed",
      source: scrapeSource,
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
      { error: e instanceof Error ? e.message : "Internal server error" },
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

    const duration = Date.now() - start;
    logRequest("GET", "/api/scrape", 200, duration, user.id);
    return NextResponse.json({ portals });
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
