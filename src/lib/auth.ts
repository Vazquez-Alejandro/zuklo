import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";
import { users, sessions } from "./schema";
import { eq } from "drizzle-orm";
import { createHash, randomBytes, timingSafeEqual } from "crypto";

const SECRET = new TextEncoder().encode(
  process.env.BETTER_AUTH_SECRET || "zuklo-default-secret-change-in-production-32ch"
);

const COOKIE_NAME = "zuklo-session";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export async function createSession(user: AuthUser): Promise<string> {
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);

  const tokenHash = createHash("sha256").update(token).digest("hex");

  await db.insert(sessions).values({
    id: randomBytes(32).toString("hex"),
    userId: user.id,
    token: tokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return token;
}

export async function verifySession(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, tokenHash))
      .limit(1);

    if (!rows.length) return null;
    if (new Date(rows[0].expiresAt) < new Date()) {
      await db.delete(sessions).where(eq(sessions.id, rows[0].id));
      return null;
    }

    return {
      id: payload.sub!,
      email: payload.email as string,
      name: payload.name as string | null,
    };
  } catch {
    return null;
  }
}

export async function deleteSession(token: string): Promise<void> {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await db.delete(sessions).where(eq(sessions.token, tokenHash));
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(salt + password).digest("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const computed = createHash("sha256").update(salt + password).digest("hex");
  return timingSafeEqual(Buffer.from(hash), Buffer.from(computed));
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

export async function getUserFromRequest(request: Request): Promise<AuthUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifySession(token);
}

export async function requireAuth(request: Request): Promise<AuthUser> {
  const user = await getUserFromRequest(request);
  if (!user) throw new Error("Unauthorized");
  return user;
}

export { COOKIE_NAME };
