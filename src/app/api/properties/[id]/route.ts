import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { properties } from "@/lib/schema";
import { requireAuth } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`properties:get:${user.id}`, 100, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { id } = await params;
    const rows = await db.select().from(properties).where(eq(properties.id, id)).limit(1);

    if (rows.length === 0) {
      const duration = Date.now() - start;
      logRequest("GET", `/api/properties/${id}`, 404, duration, user.id);
      return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });
    }

    const duration = Date.now() - start;
    logRequest("GET", `/api/properties/${id}`, 200, duration, user.id);
    return NextResponse.json({ property: rows[0] });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("GET", `/api/properties/[id]`, 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("GET", `/api/properties/[id]`, 500, duration);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
