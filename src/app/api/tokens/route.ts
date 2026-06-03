import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase";
import { registerDeviceToken, removeDeviceToken, getUserTokens } from "@/lib/notification-service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "token is required" },
        { status: 400 }
      );
    }

    await registerDeviceToken(user.id, token);
    const tokens = await getUserTokens(user.id);

    return NextResponse.json({
      registered: true,
      totalTokens: tokens.length,
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

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "token is required" },
        { status: 400 }
      );
    }

    await removeDeviceToken(user.id, token);
    const tokens = await getUserTokens(user.id);

    return NextResponse.json({
      removed: true,
      remainingTokens: tokens.length,
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

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const tokens = await getUserTokens(user.id);
    return NextResponse.json({
      userId: user.id,
      tokens: tokens.map((t) => t.substring(0, 20) + "..."),
      count: tokens.length,
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
