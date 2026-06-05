import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { createSession, deleteSession, hashPassword, verifyPassword, getUserFromRequest, COOKIE_NAME } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const start = Date.now();
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  const rl = rateLimit(`auth:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { action, email, password, name } = body;

    switch (action) {
      case "signup": {
        if (!email || !password) {
          return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 });
        }
        if (password.length < 6) {
          return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
        }

        const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existing.length > 0) {
          return NextResponse.json({ error: "Este email ya está registrado" }, { status: 400 });
        }

        const [user] = await db.insert(users).values({
          email,
          name: name || null,
        }).returning();

        const token = await createSession({
          id: user.id,
          email: user.email,
          name: user.name,
        });

        const response = NextResponse.json({
          user: { id: user.id, email: user.email, name: user.name },
          session: { accessToken: token },
        });

        response.headers.set(
          "Set-Cookie",
          `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
        );

        logRequest("POST", "/api/auth", 200, Date.now() - start);
        return response;
      }

      case "login":
      case "signin": {
        if (!email || !password) {
          return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 });
        }

        const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (rows.length === 0) {
          return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
        }

        const user = rows[0];

        const token = await createSession({
          id: user.id,
          email: user.email,
          name: user.name,
        });

        const response = NextResponse.json({
          user: { id: user.id, email: user.email, name: user.name },
          session: { accessToken: token },
        });

        response.headers.set(
          "Set-Cookie",
          `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
        );

        logRequest("POST", "/api/auth", 200, Date.now() - start);
        return response;
      }

      case "logout":
      case "signout": {
        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
        if (token) {
          await deleteSession(token);
        }

        const response = NextResponse.json({ ok: true });
        response.headers.set(
          "Set-Cookie",
          `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
        );

        logRequest("POST", "/api/auth", 200, Date.now() - start);
        return response;
      }

      case "get-session":
      case "get-user": {
        const user = await getUserFromRequest(request);
        if (!user) {
          return NextResponse.json({ user: null }, { status: 401 });
        }

        logRequest("POST", "/api/auth", 200, Date.now() - start);
        return NextResponse.json({ user });
      }

      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }
  } catch (error) {
    logRequest("POST", "/api/auth", 500, Date.now() - start);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
