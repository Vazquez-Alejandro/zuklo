import { NextRequest, NextResponse } from "next/server";
import {
  createTenantProfile,
  getTenantProfileByUser,
  updateTenantProfile,
  deleteTenantProfile,
  generateProfileSummary,
} from "@/lib/tenant-profile";
import { checkFeatureAccess, incrementUsage } from "@/lib/monetization";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`profile:post:${user.id}`, 50, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();

    const access = await checkFeatureAccess(user.id, "tenantProfile");
    if (!access.allowed) {
      const duration = Date.now() - start;
      logRequest("POST", "/api/profile", 403, duration, user.id);
      return NextResponse.json(
        { error: access.reason },
        { status: 403 }
      );
    }

    const existing = await getTenantProfileByUser(user.id);
    if (existing) {
      const duration = Date.now() - start;
      logRequest("POST", "/api/profile", 409, duration, user.id);
      return NextResponse.json(
        { error: "Profile already exists for this user" },
        { status: 409 }
      );
    }

    const profile = await createTenantProfile({ ...body, userId: user.id });
    const summary = generateProfileSummary(profile);
    await incrementUsage(user.id, "tenantProfilesCreated");

    const duration = Date.now() - start;
    logRequest("POST", "/api/profile", 201, duration, user.id);
    return NextResponse.json({ profile, summary }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("POST", "/api/profile", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("POST", "/api/profile", 500, duration);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`profile:get:${user.id}`, 100, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const profile = await getTenantProfileByUser(user.id);
    if (!profile) {
      const duration = Date.now() - start;
      logRequest("GET", "/api/profile", 404, duration, user.id);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const summary = generateProfileSummary(profile);
    const duration = Date.now() - start;
    logRequest("GET", "/api/profile", 200, duration, user.id);
    return NextResponse.json({ profile, summary });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("GET", "/api/profile", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("GET", "/api/profile", 500, duration);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`profile:put:${user.id}`, 50, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const { ...updateData } = body;

    const existing = await getTenantProfileByUser(user.id);
    if (!existing) {
      const duration = Date.now() - start;
      logRequest("PUT", "/api/profile", 404, duration, user.id);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profile = await updateTenantProfile(existing.id, { ...updateData, userId: user.id });
    if (!profile) {
      const duration = Date.now() - start;
      logRequest("PUT", "/api/profile", 404, duration, user.id);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const summary = generateProfileSummary(profile);
    const duration = Date.now() - start;
    logRequest("PUT", "/api/profile", 200, duration, user.id);
    return NextResponse.json({ profile, summary });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("PUT", "/api/profile", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("PUT", "/api/profile", 500, duration);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`profile:delete:${user.id}`, 50, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const existing = await getTenantProfileByUser(user.id);
    if (!existing) {
      const duration = Date.now() - start;
      logRequest("DELETE", "/api/profile", 404, duration, user.id);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const deleted = await deleteTenantProfile(existing.id);
    if (!deleted) {
      const duration = Date.now() - start;
      logRequest("DELETE", "/api/profile", 404, duration, user.id);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const duration = Date.now() - start;
    logRequest("DELETE", "/api/profile", 200, duration, user.id);
    return NextResponse.json({ deleted: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("DELETE", "/api/profile", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("DELETE", "/api/profile", 500, duration);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
