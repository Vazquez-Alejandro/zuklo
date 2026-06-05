import { NextRequest, NextResponse } from "next/server";
import { eq, ilike, gte, lte, and, or, sql, desc, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { properties } from "@/lib/schema";
import { requireAuth } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/logger";

const SORT_COLUMNS = {
  price: properties.price,
  bedrooms: properties.bedrooms,
  area: properties.area,
  createdAt: properties.createdAt,
} as const;

type SortKey = keyof typeof SORT_COLUMNS;

export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`properties:get:${user.id}`, 100, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const rawLimit = parseInt(searchParams.get("limit") ?? "20", 10);
    const limit = Math.min(50, Math.max(1, rawLimit));
    const offset = (page - 1) * limit;

    const search = searchParams.get("search")?.trim() || null;
    const portal = searchParams.get("portal")?.trim() || null;
    const city = searchParams.get("city")?.trim() || null;
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const bedrooms = searchParams.get("bedrooms");
    const sortByParam = searchParams.get("sortBy") ?? "createdAt";
    const sortOrderParam = searchParams.get("sortOrder") ?? "desc";

    const sortBy: SortKey =
      sortByParam in SORT_COLUMNS ? (sortByParam as SortKey) : "createdAt";
    const sortOrder = sortOrderParam === "asc" ? asc : desc;

    const conditions = [];

    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(properties.title, pattern),
          ilike(properties.address, pattern),
          ilike(properties.city, pattern),
          ilike(properties.description, pattern)
        )
      );
    }

    if (portal) {
      conditions.push(eq(properties.portal, portal));
    }

    if (city) {
      conditions.push(eq(properties.city, city));
    }

    if (minPrice) {
      conditions.push(gte(properties.price, minPrice));
    }

    if (maxPrice) {
      conditions.push(lte(properties.price, maxPrice));
    }

    if (bedrooms) {
      conditions.push(eq(properties.bedrooms, parseInt(bedrooms, 10)));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, rows] = await Promise.all([
      db
        .select({ value: sql<number>`count(*)::int` })
        .from(properties)
        .where(where),
      db
        .select()
        .from(properties)
        .where(where)
        .orderBy(sortOrder(SORT_COLUMNS[sortBy]))
        .limit(limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.value ?? 0;
    const totalPages = Math.ceil(total / limit);

    const duration = Date.now() - start;
    logRequest("GET", "/api/properties", 200, duration, user.id);

    return NextResponse.json({
      properties: rows,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("GET", "/api/properties", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("GET", "/api/properties", 500, duration);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
