import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { registerDeviceToken, removeDeviceToken, getUserTokens } from "@/lib/notification-service";
import { rateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`tokens:post:${user.id}`, 50, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      const duration = Date.now() - start;
      logRequest("POST", "/api/tokens", 400, duration, user.id);
      return NextResponse.json(
        { error: "token is required" },
        { status: 400 }
      );
    }

    await registerDeviceToken(user.id, token);
    const tokens = await getUserTokens(user.id);

    const duration = Date.now() - start;
    logRequest("POST", "/api/tokens", 200, duration, user.id);
    return NextResponse.json({
      registered: true,
      totalTokens: tokens.length,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("POST", "/api/tokens", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("POST", "/api/tokens", 500, duration);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`tokens:delete:${user.id}`, 50, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      const duration = Date.now() - start;
      logRequest("DELETE", "/api/tokens", 400, duration, user.id);
      return NextResponse.json(
        { error: "token is required" },
        { status: 400 }
      );
    }

    await removeDeviceToken(user.id, token);
    const tokens = await getUserTokens(user.id);

    const duration = Date.now() - start;
    logRequest("DELETE", "/api/tokens", 200, duration, user.id);
    return NextResponse.json({
      removed: true,
      remainingTokens: tokens.length,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("DELETE", "/api/tokens", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("DELETE", "/api/tokens", 500, duration);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`tokens:get:${user.id}`, 100, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const tokens = await getUserTokens(user.id);
    const duration = Date.now() - start;
    logRequest("GET", "/api/tokens", 200, duration, user.id);
    return NextResponse.json({
      userId: user.id,
      tokens: tokens.map((t) => t.substring(0, 20) + "..."),
      count: tokens.length,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("GET", "/api/tokens", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("GET", "/api/tokens", 500, duration);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
