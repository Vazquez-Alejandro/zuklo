import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getNotificationLogs } from "@/lib/notification-service";
import { rateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`notifications:get:${user.id}`, 100, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const filterId = searchParams.get("filterId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const logs = await getNotificationLogs(filterId || undefined, limit);

    const duration = Date.now() - start;
    logRequest("GET", "/api/notifications", 200, duration, user.id);
    return NextResponse.json({
      notifications: logs,
      total: logs.length,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("GET", "/api/notifications", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("GET", "/api/notifications", 500, duration);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
