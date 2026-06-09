import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, sessions, verification } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { createSession, deleteSession, hashPassword, verifyPassword, getUserFromRequest, COOKIE_NAME } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/logger";
import { randomBytes } from "crypto";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const start = Date.now();
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  const rl = rateLimit(`auth:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiados intentos. Esperá un minuto." }, { status: 429 });
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
        if (!body.termsAccepted) {
          return NextResponse.json({ error: "Debés aceptar los Términos y Condiciones" }, { status: 400 });
        }

        const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existing.length > 0) {
          return NextResponse.json({ error: "Este email ya está registrado" }, { status: 400 });
        }

        const passwordHash = hashPassword(password);
        const [user] = await db.insert(users).values({
          email,
          name: name || null,
          password: passwordHash,
          termsAcceptedAt: body.termsAcceptedAt ? new Date(body.termsAcceptedAt) : null,
        }).returning();

        const token = await createSession({
          id: user.id,
          email: user.email,
          name: user.name,
        });

        const verToken = randomBytes(32).toString("hex");
        const verExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await db.insert(verification).values({
          id: randomBytes(16).toString("hex"),
          identifier: `email-verify:${user.email}`,
          value: verToken,
          expiresAt: verExpires,
        });
        const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${verToken}&email=${encodeURIComponent(user.email)}`;
        sendVerificationEmail(user.email, verifyUrl).catch(() => {});

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

        const loginRl = rateLimit(`auth:login:${email}`, 5, 900_000);
        if (!loginRl.allowed) {
          return NextResponse.json({ error: "Demasiados intentos fallidos. Esperá 15 minutos." }, { status: 429 });
        }

        const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (rows.length === 0) {
          return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
        }

        const user = rows[0];

        if (!user.password || !verifyPassword(password, user.password)) {
          return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
        }

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

      case "update-password": {
        const authUser = await getUserFromRequest(request);
        if (!authUser) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!password || !body.currentPassword) {
          return NextResponse.json({ error: "Contraseña actual y nueva contraseña son requeridas" }, { status: 400 });
        }
        if (password.length < 6) {
          return NextResponse.json({ error: "La nueva contraseña debe tener al menos 6 caracteres" }, { status: 400 });
        }

        const rows = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
        if (rows.length === 0) {
          return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        const userRow = rows[0];
        if (!userRow.password || !verifyPassword(body.currentPassword, userRow.password)) {
          return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 });
        }

        const newHash = hashPassword(password);
        await db.update(users).set({ password: newHash, updatedAt: new Date() }).where(eq(users.id, authUser.id));

        logRequest("POST", "/api/auth", 200, Date.now() - start);
        return NextResponse.json({ message: "Contraseña actualizada correctamente" });
      }

      case "forgot-password": {
        if (!email) {
          return NextResponse.json({ error: "El email es requerido" }, { status: 400 });
        }

        const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (rows.length === 0) {
          return NextResponse.json({ message: "Si el email está registrado, recibirás un link de recuperación" });
        }

        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await db.insert(verification).values({
          id: randomBytes(16).toString("hex"),
          identifier: `password-reset:${email}`,
          value: token,
          expiresAt,
        });

        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

        await sendPasswordResetEmail(email, resetUrl);

        logRequest("POST", "/api/auth", 200, Date.now() - start);
        return NextResponse.json({
          message: "Si el email está registrado, recibirás un link de recuperación",
        });
      }

      case "reset-password": {
        if (!email || !password || !body.token) {
          return NextResponse.json({ error: "Email, token y nueva contraseña son requeridos" }, { status: 400 });
        }
        if (password.length < 6) {
          return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
        }

        const tokenHash = body.token;
        const rows = await db.select().from(verification).where(
          eq(verification.identifier, `password-reset:${email}`)
        ).limit(1);

        if (rows.length === 0 || rows[0].value !== tokenHash) {
          return NextResponse.json({ error: "Token inválido" }, { status: 400 });
        }

        if (new Date(rows[0].expiresAt) < new Date()) {
          return NextResponse.json({ error: "Token expirado. Solicitá uno nuevo." }, { status: 400 });
        }

        const userRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (userRows.length === 0) {
          return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        const newHash = hashPassword(password);
        await db.update(users).set({ password: newHash, updatedAt: new Date() }).where(eq(users.email, email));
        await db.delete(verification).where(eq(verification.id, rows[0].id));

        logRequest("POST", "/api/auth", 200, Date.now() - start);
        return NextResponse.json({ message: "Contraseña actualizada correctamente" });
      }

      case "send-verification": {
        const authUser = await getUserFromRequest(request);
        if (!authUser) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await db.insert(verification).values({
          id: randomBytes(16).toString("hex"),
          identifier: `email-verify:${authUser.email}`,
          value: token,
          expiresAt,
        });

        const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth?action=verify-email&token=${token}&email=${encodeURIComponent(authUser.email)}`;

        await sendVerificationEmail(authUser.email, verifyUrl);

        logRequest("POST", "/api/auth", 200, Date.now() - start);
        return NextResponse.json({
          message: "Email de verificación enviado",
        });
      }

      case "verify-email": {
        if (!email || !body.token) {
          return NextResponse.json({ error: "Email y token son requeridos" }, { status: 400 });
        }

        const rows = await db.select().from(verification).where(
          eq(verification.identifier, `email-verify:${email}`)
        ).limit(1);

        if (rows.length === 0 || rows[0].value !== body.token) {
          return NextResponse.json({ error: "Token inválido" }, { status: 400 });
        }

        if (new Date(rows[0].expiresAt) < new Date()) {
          return NextResponse.json({ error: "Token expirado. Solicitá uno nuevo." }, { status: 400 });
        }

        await db.update(users).set({ emailVerified: true, updatedAt: new Date() }).where(eq(users.email, email));
        await db.delete(verification).where(eq(verification.id, rows[0].id));

        logRequest("POST", "/api/auth", 200, Date.now() - start);
        return NextResponse.json({ message: "Email verificado correctamente" });
      }

      case "delete-account": {
        const authUser = await getUserFromRequest(request);
        if (!authUser) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await db.delete(sessions).where(eq(sessions.userId, authUser.id));
        await db.delete(users).where(eq(users.id, authUser.id));

        const response = NextResponse.json({ message: "Cuenta eliminada correctamente" });
        response.headers.set(
          "Set-Cookie",
          `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
        );

        logRequest("POST", "/api/auth", 200, Date.now() - start);
        return response;
      }

      case "accept-terms": {
        const authUser = await getUserFromRequest(request);
        if (!authUser) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await db.update(users).set({
          termsAcceptedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(users.id, authUser.id));

        logRequest("POST", "/api/auth", 200, Date.now() - start);
        return NextResponse.json({ message: "Términos aceptados" });
      }

      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }
  } catch (error) {
    logRequest("POST", "/api/auth", 500, Date.now() - start);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
