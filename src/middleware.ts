import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/onboarding",
  "/sentry-example-page",
  "/pricing",
  "/about",
  "/api/auth",
  "/api/webhook",
];

const apiPublicRoutes = [
  "/api/auth",
  "/api/webhook",
  "/api/health",
  "/api/docs",
  "/api/arco",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (apiPublicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("Authorization");
  const token = request.cookies.get("zuklo-session")?.value;

  if (!authHeader && !token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();

  response.headers.set("x-pathname", pathname);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
