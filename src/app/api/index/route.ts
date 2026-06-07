import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  calculateRentIncrease,
  calculateNextAdjustmentDate,
  generateAdjustmentHistory,
  getLatestICL,
  getLatestIPC,
  getIndexValueAsync,
} from "@/lib/index-calculator";
import { rateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`index:post:${user.id}`, 50, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "calculate": {
        const { currentRent, indexType, baseDate, currentDate, customPercentage } = body;

        if (!currentRent || !indexType || !baseDate || !currentDate) {
          const duration = Date.now() - start;
          logRequest("POST", "/api/index", 400, duration, user.id);
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

        const duration = Date.now() - start;
        logRequest("POST", "/api/index", 200, duration, user.id);
        return NextResponse.json({ result });
      }

      case "next-adjustment": {
        const { lastAdjustmentDate, frequency } = body;

        if (!lastAdjustmentDate || !frequency) {
          const duration = Date.now() - start;
          logRequest("POST", "/api/index", 400, duration, user.id);
          return NextResponse.json(
            { error: "lastAdjustmentDate and frequency are required" },
            { status: 400 }
          );
        }

        const nextDate = calculateNextAdjustmentDate(lastAdjustmentDate, frequency);
        const duration = Date.now() - start;
        logRequest("POST", "/api/index", 200, duration, user.id);
        return NextResponse.json({ nextAdjustmentDate: nextDate });
      }

      case "history": {
        const { baseRent, indexType, startDate, frequency, customPercentage } = body;

        if (!baseRent || !indexType || !startDate || !frequency) {
          const duration = Date.now() - start;
          logRequest("POST", "/api/index", 400, duration, user.id);
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

        const duration = Date.now() - start;
        logRequest("POST", "/api/index", 200, duration, user.id);
        return NextResponse.json({ history });
      }

      default:
        const duration = Date.now() - start;
        logRequest("POST", "/api/index", 400, duration, user.id);
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("POST", "/api/index", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("POST", "/api/index", 500, duration);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rl = rateLimit(`index:get:${ip}`, 100, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as "icl" | "ipc";
    const date = searchParams.get("date");

    if (!type || !["icl", "ipc"].includes(type)) {
      const duration = Date.now() - start;
      logRequest("GET", "/api/index", 400, duration);
      return NextResponse.json(
        { error: "type must be 'icl' or 'ipc'" },
        { status: 400 }
      );
    }

    if (date) {
      const value = await getIndexValueAsync(type, date);
      if (!value) {
        const duration = Date.now() - start;
        logRequest("GET", "/api/index", 404, duration);
        return NextResponse.json({ error: "Index value not found" }, { status: 404 });
      }
      const duration = Date.now() - start;
      logRequest("GET", "/api/index", 200, duration);
      return NextResponse.json({ index: value });
    }

    const latest = type === "icl" ? await getLatestICL() : await getLatestIPC();
    const duration = Date.now() - start;
    logRequest("GET", "/api/index", 200, duration);
    return NextResponse.json({ index: latest });
  } catch {
    const duration = Date.now() - start;
    logRequest("GET", "/api/index", 500, duration);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
