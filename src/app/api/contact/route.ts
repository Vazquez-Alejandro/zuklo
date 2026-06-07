import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { properties } from "@/lib/schema";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/logger";
import { sendContactEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`contact:post:${user.id}`, 5, 3600_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded (5/hora)" }, { status: 429 });
    }

    const body = await request.json();
    const { propertyId, message } = body;

    if (!propertyId || !message) {
      return NextResponse.json({ error: "propertyId y message son requeridos" }, { status: 400 });
    }

    if (message.length < 10) {
      return NextResponse.json({ error: "El mensaje debe tener al menos 10 caracteres" }, { status: 400 });
    }

    const prop = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
    if (prop.length === 0) {
      return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });
    }

    const property = prop[0];
    const landlordEmail = property.landlordEmail || `contacto@${property.portal}.com.ar`;
    const landlordName = property.landlordName || "Propietario";

    await sendContactEmail(
      landlordEmail,
      landlordName,
      property.title,
      user.name || user.email,
      user.email,
      message
    );

    const duration = Date.now() - start;
    logRequest("POST", "/api/contact", 200, duration, user.id);
    return NextResponse.json({ message: "Consulta enviada correctamente" });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("POST", "/api/contact", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("POST", "/api/contact", 500, duration);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
