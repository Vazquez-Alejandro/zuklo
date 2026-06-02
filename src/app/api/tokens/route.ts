import { NextRequest, NextResponse } from "next/server";
import { registerDeviceToken, removeDeviceToken, getUserTokens } from "@/lib/notification-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token } = body;

    if (!userId || !token) {
      return NextResponse.json(
        { error: "userId and token are required" },
        { status: 400 }
      );
    }

    registerDeviceToken(userId, token);
    const tokens = getUserTokens(userId);

    return NextResponse.json({
      registered: true,
      totalTokens: tokens.length,
    });
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
    const userId = searchParams.get("userId");
    const token = searchParams.get("token");

    if (!userId || !token) {
      return NextResponse.json(
        { error: "userId and token are required" },
        { status: 400 }
      );
    }

    removeDeviceToken(userId, token);
    const tokens = getUserTokens(userId);

    return NextResponse.json({
      removed: true,
      remainingTokens: tokens.length,
    });
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

    const tokens = getUserTokens(userId);
    return NextResponse.json({
      userId,
      tokens: tokens.map((t) => t.substring(0, 20) + "..."),
      count: tokens.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
