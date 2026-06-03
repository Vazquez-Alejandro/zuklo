import { NextRequest, NextResponse } from "next/server";
import {
  createTenantProfile,
  getTenantProfileByUser,
  updateTenantProfile,
  deleteTenantProfile,
  generateProfileSummary,
} from "@/lib/tenant-profile";
import { checkFeatureAccess, incrementUsage } from "@/lib/monetization";
import { requireAuth } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    const access = await checkFeatureAccess(user.id, "tenantProfile");
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.reason },
        { status: 403 }
      );
    }

    const existing = await getTenantProfileByUser(user.id);
    if (existing) {
      return NextResponse.json(
        { error: "Profile already exists for this user" },
        { status: 409 }
      );
    }

    const profile = await createTenantProfile({ ...body, userId: user.id });
    const summary = generateProfileSummary(profile);
    await incrementUsage(user.id, "tenantProfilesCreated");

    return NextResponse.json({ profile, summary }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const profile = await getTenantProfileByUser(user.id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const summary = generateProfileSummary(profile);
    return NextResponse.json({ profile, summary });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { ...updateData } = body;

    const existing = await getTenantProfileByUser(user.id);
    if (!existing) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profile = await updateTenantProfile(existing.id, { ...updateData, userId: user.id });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const summary = generateProfileSummary(profile);
    return NextResponse.json({ profile, summary });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const existing = await getTenantProfileByUser(user.id);
    if (!existing) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const deleted = await deleteTenantProfile(existing.id);
    if (!deleted) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
