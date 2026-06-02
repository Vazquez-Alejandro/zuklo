import { NextRequest, NextResponse } from "next/server";
import {
  createFilter,
  getFiltersByUser,
  deleteFilter,
  type CreateFilterInput,
} from "@/lib/filters";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
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

    if (!userId || !name) {
      return NextResponse.json(
        { error: "userId and name are required" },
        { status: 400 }
      );
    }

    const input: CreateFilterInput = {
      userId,
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

    const filter = createFilter(input);

    return NextResponse.json({ filter }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const filters = getFiltersByUser(userId);
    return NextResponse.json({ filters });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterId = searchParams.get("filterId");

    if (!filterId) {
      return NextResponse.json(
        { error: "filterId is required" },
        { status: 400 }
      );
    }

    const deleted = deleteFilter(filterId);
    if (!deleted) {
      return NextResponse.json({ error: "Filter not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
