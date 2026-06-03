import { NextRequest, NextResponse } from "next/server";
import {
  createFilter,
  getFiltersByUser,
  deleteFilter,
  type CreateFilterInput,
} from "@/lib/filters";
import { checkFeatureAccess, incrementUsage } from "@/lib/monetization";
import { requireAuth } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
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
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const access = await checkFeatureAccess(user.id, "maxFilters");
    if (!access.allowed) {
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

    return NextResponse.json({ filter }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const filters = await getFiltersByUser(user.id);
    return NextResponse.json({ filters });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const filterId = searchParams.get("filterId");

    if (!filterId) {
      return NextResponse.json(
        { error: "filterId is required" },
        { status: 400 }
      );
    }

    const filters = await getFiltersByUser(user.id);
    const belongsToUser = filters.some((f) => f.id === filterId);
    if (!belongsToUser) {
      return NextResponse.json({ error: "Filter not found" }, { status: 404 });
    }

    const deleted = await deleteFilter(filterId);
    if (!deleted) {
      return NextResponse.json({ error: "Filter not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
