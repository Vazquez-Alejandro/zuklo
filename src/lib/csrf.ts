import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.CSRF_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function hmac(data: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(data).digest();
}

export function generateToken(sessionId: string): string {
  const ts = Date.now().toString();
  const payload = `${sessionId}:${ts}`;
  const signature = base64url(hmac(payload, SECRET));
  return base64url(Buffer.from(`${payload}:${signature}`));
}

export function validateToken(token: string, sessionId: string): boolean {
  try {
    const decoded = Buffer.from(token.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString();
    const parts = decoded.split(":");
    if (parts.length !== 3) return false;

    const [tokenSessionId, ts, signature] = parts;

    if (tokenSessionId !== sessionId) return false;
    if (Date.now() - Number(ts) > TOKEN_EXPIRY_MS) return false;

    const expected = base64url(hmac(`${tokenSessionId}:${ts}`, SECRET));
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);

    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}
