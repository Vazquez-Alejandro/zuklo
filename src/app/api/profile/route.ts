import { NextRequest, NextResponse } from "next/server";
import {
  createTenantProfile,
  getTenantProfileByUser,
  updateTenantProfile,
  deleteTenantProfile,
  generateProfileSummary,
} from "@/lib/tenant-profile";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const existing = getTenantProfileByUser(userId);
    if (existing) {
      return NextResponse.json(
        { error: "Profile already exists for this user" },
        { status: 409 }
      );
    }

    const profile = createTenantProfile(body);
    const summary = generateProfileSummary(profile);

    return NextResponse.json({ profile, summary }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const profile = getTenantProfileByUser(userId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const summary = generateProfileSummary(profile);
    return NextResponse.json({ profile, summary });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, ...updateData } = body;

    if (!profileId) {
      return NextResponse.json({ error: "profileId is required" }, { status: 400 });
    }

    const profile = updateTenantProfile(profileId, updateData);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const summary = generateProfileSummary(profile);
    return NextResponse.json({ profile, summary });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json({ error: "profileId is required" }, { status: 400 });
    }

    const deleted = deleteTenantProfile(profileId);
    if (!deleted) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
