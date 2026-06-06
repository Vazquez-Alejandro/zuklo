import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { favorites, properties } from "@/lib/schema";
import { requireAuth } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`favorites:get:${user.id}`, 100, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const rows = await db
      .select({
        id: favorites.id,
        propertyId: favorites.propertyId,
        createdAt: favorites.createdAt,
        property: properties,
      })
      .from(favorites)
      .innerJoin(properties, eq(favorites.propertyId, properties.id))
      .where(eq(favorites.userId, user.id))
      .orderBy(favorites.createdAt);

    const duration = Date.now() - start;
    logRequest("GET", "/api/favorites", 200, duration, user.id);
    return NextResponse.json({ favorites: rows });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("GET", "/api/favorites", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("GET", "/api/favorites", 500, duration);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`favorites:post:${user.id}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const { propertyId } = body;

    if (!propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    const prop = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
    if (prop.length === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const existing = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, user.id), eq(favorites.propertyId, propertyId)))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Ya tenés esta propiedad guardada" }, { status: 400 });
    }

    const [fav] = await db.insert(favorites).values({
      userId: user.id,
      propertyId,
    }).returning();

    const duration = Date.now() - start;
    logRequest("POST", "/api/favorites", 201, duration, user.id);
    return NextResponse.json({ favorite: fav }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("POST", "/api/favorites", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("POST", "/api/favorites", 500, duration);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`favorites:delete:${user.id}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    if (!propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, user.id), eq(favorites.propertyId, propertyId)));

    const duration = Date.now() - start;
    logRequest("DELETE", "/api/favorites", 200, duration, user.id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("DELETE", "/api/favorites", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("DELETE", "/api/favorites", 500, duration);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
