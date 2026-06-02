import { NextRequest, NextResponse } from "next/server";
import { getNotificationLogs } from "@/lib/notification-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterId = searchParams.get("filterId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const logs = getNotificationLogs(filterId || undefined, limit);

    return NextResponse.json({
      notifications: logs,
      total: logs.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
