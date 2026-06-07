import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, properties, subscriptions } from "@/lib/schema";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const [userCount, propCount, subCount, activeCount] = await Promise.all([
      db.select({ value: sql<number>`count(*)::int` }).from(users),
      db.select({ value: sql<number>`count(*)::int` }).from(properties),
      db.select({ value: sql<number>`count(*)::int` }).from(subscriptions),
      db.select({ value: sql<number>`count(*)::int` }).from(subscriptions).where(sql`status = 'active'`),
    ]);

    return NextResponse.json({
      users: userCount[0]?.value ?? 0,
      properties: propCount[0]?.value ?? 0,
      subscriptions: subCount[0]?.value ?? 0,
      activeSubscriptions: activeCount[0]?.value ?? 0,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
