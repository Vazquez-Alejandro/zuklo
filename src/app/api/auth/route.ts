import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
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
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

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
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({
          user: data.user,
          session: data.session,
        });
      }

      case "logout": {
        const { error } = await supabase.auth.signOut();
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: "Logged out successfully" });
      }

      case "forgot-password": {
        if (!email) {
          return NextResponse.json(
            { error: "Email is required" },
            { status: 400 }
          );
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
        });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({
          message: "Password reset email sent",
        });
      }

      case "update-password": {
        const { newPassword } = body;
        if (!newPassword) {
          return NextResponse.json(
            { error: "New password is required" },
            { status: 400 }
          );
        }

        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ message: "Password updated successfully" });
      }

      case "get-user": {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return NextResponse.json({ user: null });
        }

        const token = authHeader.split(" ")[1];
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
          return NextResponse.json({ user: null });
        }

        return NextResponse.json({ user });
      }

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
