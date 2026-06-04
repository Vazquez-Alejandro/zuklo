import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";

interface HealthResponse {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  services: {
    postgres: boolean;
    redis: boolean;
  };
}

async function checkPostgres(): Promise<boolean> {
  try {
    const { error } = await supabase.from("tenants").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

async function checkRedis(): Promise<boolean> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return false;
  try {
    const { default: Redis } = await import("ioredis");
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
    });
    await client.connect();
    const pong = await client.ping();
    await client.quit();
    return pong === "PONG";
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rl = rateLimit(`health:${ip}`, 100, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const [postgres, redis] = await Promise.all([checkPostgres(), checkRedis()]);

  const hasRedisConfig = !!process.env.REDIS_URL;
  let status: HealthResponse["status"];
  if (postgres && (!hasRedisConfig || redis)) {
    status = "ok";
  } else if (postgres) {
    status = "degraded";
  } else {
    status = "error";
  }

  const response: HealthResponse = {
    status,
    timestamp: new Date().toISOString(),
    services: { postgres, redis },
  };

  const httpStatus = status === "error" ? 503 : 200;
  return NextResponse.json(response, { status: httpStatus });
}
