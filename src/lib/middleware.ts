import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";

export async function authMiddleware(
  request: NextRequest,
  handler: (req: NextRequest, user: { id: string; email: string }) => Promise<NextResponse>
) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return handler(request, { id: user.id, email: user.email || "" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export function withAuth(
  handler: (req: NextRequest, user: { id: string; email: string }) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    return authMiddleware(request, handler);
  };
}
