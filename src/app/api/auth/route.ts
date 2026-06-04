import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const rl = rateLimit(`auth:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const start = Date.now();
  try {
    const body = await request.json();
    const { action, email, password, name } = body;

    switch (action) {
      case "signup": {
        if (!email || !password) {
          return NextResponse.json(
            { error: "Email and password are required" },
            { status: 400 }
          );
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name || email.split("@")[0],
            },
          },
        });

        if (error) {
          const duration = Date.now() - start;
          logRequest("POST", "/api/auth", 400, duration);
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        const duration = Date.now() - start;
        logRequest("POST", "/api/auth", 200, duration, data.user?.id);
        return NextResponse.json({
          user: data.user,
          session: data.session,
          message: data.user?.identities?.length === 0
            ? "Email already registered"
            : "Account created successfully",
        });
      }

      case "login": {
        if (!email || !password) {
          const duration = Date.now() - start;
          logRequest("POST", "/api/auth", 400, duration);
          return NextResponse.json(
            { error: "Email and password are required" },
            { status: 400 }
          );
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          const duration = Date.now() - start;
          logRequest("POST", "/api/auth", 400, duration);
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        const duration = Date.now() - start;
        logRequest("POST", "/api/auth", 200, duration, data.user?.id);
        return NextResponse.json({
          user: data.user,
          session: data.session,
        });
      }

      case "logout": {
        const { error } = await supabase.auth.signOut();
        if (error) {
          const duration = Date.now() - start;
          logRequest("POST", "/api/auth", 400, duration);
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        const duration = Date.now() - start;
        logRequest("POST", "/api/auth", 200, duration);
        return NextResponse.json({ message: "Logged out successfully" });
      }

      case "forgot-password": {
        if (!email) {
          const duration = Date.now() - start;
          logRequest("POST", "/api/auth", 400, duration);
          return NextResponse.json(
            { error: "Email is required" },
            { status: 400 }
          );
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
        });

        if (error) {
          const duration = Date.now() - start;
          logRequest("POST", "/api/auth", 400, duration);
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        const duration = Date.now() - start;
        logRequest("POST", "/api/auth", 200, duration);
        return NextResponse.json({
          message: "Password reset email sent",
        });
      }

      case "update-password": {
        const { newPassword } = body;
        if (!newPassword) {
          const duration = Date.now() - start;
          logRequest("POST", "/api/auth", 400, duration);
          return NextResponse.json(
            { error: "New password is required" },
            { status: 400 }
          );
        }

        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          const duration = Date.now() - start;
          logRequest("POST", "/api/auth", 400, duration);
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        const duration = Date.now() - start;
        logRequest("POST", "/api/auth", 200, duration);
        return NextResponse.json({ message: "Password updated successfully" });
      }

      case "get-user": {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          const duration = Date.now() - start;
          logRequest("POST", "/api/auth", 200, duration);
          return NextResponse.json({ user: null });
        }

        const token = authHeader.split(" ")[1];
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
          const duration = Date.now() - start;
          logRequest("POST", "/api/auth", 200, duration);
          return NextResponse.json({ user: null });
        }

        const duration = Date.now() - start;
        logRequest("POST", "/api/auth", 200, duration, user.id);
        return NextResponse.json({ user });
      }

      default:
        const duration = Date.now() - start;
        logRequest("POST", "/api/auth", 400, duration);
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Auth error:", error);
    const duration = Date.now() - start;
    logRequest("POST", "/api/auth", 500, duration);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
