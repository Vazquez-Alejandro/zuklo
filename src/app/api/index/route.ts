import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase";
import {
  calculateRentIncrease,
  calculateNextAdjustmentDate,
  generateAdjustmentHistory,
  getIndexValue,
  getLatestIndexValue,
} from "@/lib/index-calculator";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "calculate": {
        const { currentRent, indexType, baseDate, currentDate, customPercentage } = body;

        if (!currentRent || !indexType || !baseDate || !currentDate) {
          return NextResponse.json(
            { error: "currentRent, indexType, baseDate, and currentDate are required" },
            { status: 400 }
          );
        }

        const result = calculateRentIncrease(
          currentRent,
          indexType,
          baseDate,
          currentDate,
          customPercentage
        );

        return NextResponse.json({ result });
      }

      case "next-adjustment": {
        const { lastAdjustmentDate, frequency } = body;

        if (!lastAdjustmentDate || !frequency) {
          return NextResponse.json(
            { error: "lastAdjustmentDate and frequency are required" },
            { status: 400 }
          );
        }

        const nextDate = calculateNextAdjustmentDate(lastAdjustmentDate, frequency);
        return NextResponse.json({ nextAdjustmentDate: nextDate });
      }

      case "history": {
        const { baseRent, indexType, startDate, frequency, customPercentage } = body;

        if (!baseRent || !indexType || !startDate || !frequency) {
          return NextResponse.json(
            { error: "baseRent, indexType, startDate, and frequency are required" },
            { status: 400 }
          );
        }

        const history = generateAdjustmentHistory(
          baseRent,
          indexType,
          startDate,
          frequency,
          customPercentage
        );

        return NextResponse.json({ history });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as "icl" | "ipc";
    const date = searchParams.get("date");

    if (!type || !["icl", "ipc"].includes(type)) {
      return NextResponse.json(
        { error: "type must be 'icl' or 'ipc'" },
        { status: 400 }
      );
    }

    if (date) {
      const value = getIndexValue(type, date);
      if (!value) {
        return NextResponse.json({ error: "Index value not found" }, { status: 404 });
      }
      return NextResponse.json({ index: value });
    }

    const latest = getLatestIndexValue(type);
    return NextResponse.json({ index: latest });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
