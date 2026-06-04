import { NextRequest, NextResponse } from "next/server";
import {
  createFilter,
  getFiltersByUser,
  deleteFilter,
  type CreateFilterInput,
} from "@/lib/filters";
import { checkFeatureAccess, incrementUsage } from "@/lib/monetization";
import { requireAuth } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`filters:post:${user.id}`, 50, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const {
      name,
      priceRange,
      expensesRange,
      location,
      features,
      restrictions,
      portals,
      keywords,
      excludeKeywords,
      notification,
    } = body;

    if (!name) {
      const duration = Date.now() - start;
      logRequest("POST", "/api/filters", 400, duration, user.id);
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const access = await checkFeatureAccess(user.id, "maxFilters");
    if (!access.allowed) {
      const duration = Date.now() - start;
      logRequest("POST", "/api/filters", 403, duration, user.id);
      return NextResponse.json(
        { error: access.reason },
        { status: 403 }
      );
    }

    const input: CreateFilterInput = {
      userId: user.id,
      name,
      priceRange,
      expensesRange,
      location,
      features,
      restrictions,
      portals,
      keywords,
      excludeKeywords,
      notification,
    };

    const filter = await createFilter(input);
    await incrementUsage(user.id, "filtersCreated");

    const duration = Date.now() - start;
    logRequest("POST", "/api/filters", 201, duration, user.id);
    return NextResponse.json({ filter }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("POST", "/api/filters", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("POST", "/api/filters", 500, duration);
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
    const rl = rateLimit(`filters:get:${user.id}`, 100, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const filters = await getFiltersByUser(user.id);
    const duration = Date.now() - start;
    logRequest("GET", "/api/filters", 200, duration, user.id);
    return NextResponse.json({ filters });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("GET", "/api/filters", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("GET", "/api/filters", 500, duration);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`filters:delete:${user.id}`, 50, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const filterId = searchParams.get("filterId");

    if (!filterId) {
      const duration = Date.now() - start;
      logRequest("DELETE", "/api/filters", 400, duration, user.id);
      return NextResponse.json(
        { error: "filterId is required" },
        { status: 400 }
      );
    }

    const filters = await getFiltersByUser(user.id);
    const belongsToUser = filters.some((f) => f.id === filterId);
    if (!belongsToUser) {
      const duration = Date.now() - start;
      logRequest("DELETE", "/api/filters", 404, duration, user.id);
      return NextResponse.json({ error: "Filter not found" }, { status: 404 });
    }

    const deleted = await deleteFilter(filterId);
    if (!deleted) {
      const duration = Date.now() - start;
      logRequest("DELETE", "/api/filters", 404, duration, user.id);
      return NextResponse.json({ error: "Filter not found" }, { status: 404 });
    }

    const duration = Date.now() - start;
    logRequest("DELETE", "/api/filters", 200, duration, user.id);
    return NextResponse.json({ deleted: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("DELETE", "/api/filters", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("DELETE", "/api/filters", 500, duration);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
