import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase";
import { getNotificationLogs } from "@/lib/notification-service";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const filterId = searchParams.get("filterId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const logs = await getNotificationLogs(filterId || undefined, limit);

    return NextResponse.json({
      notifications: logs,
      total: logs.length,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
