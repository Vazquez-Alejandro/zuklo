import { NextRequest, NextResponse } from "next/server";
import { getTenantProfileByUser } from "@/lib/tenant-profile";
import { generateProfilePDF, generateProfileHTML } from "@/lib/pdf-generator";
import { checkFeatureAccess, incrementUsage } from "@/lib/monetization";
import { requireAuth } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`pdf:get:${user.id}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "pdf";

    const access = await checkFeatureAccess(user.id, "tenantProfile");
    if (!access.allowed) {
      const duration = Date.now() - start;
      logRequest("GET", "/api/pdf", 403, duration, user.id);
      return NextResponse.json(
        { error: access.reason },
        { status: 403 }
      );
    }

    const profile = await getTenantProfileByUser(user.id);
    if (!profile) {
      const duration = Date.now() - start;
      logRequest("GET", "/api/pdf", 404, duration, user.id);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    await incrementUsage(user.id, "pdfExportsUsed");

    if (format === "html") {
      const html = generateProfileHTML(profile);
      const duration = Date.now() - start;
      logRequest("GET", "/api/pdf", 200, duration, user.id);
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="ficha-inquilino-${profile.personalInfo.lastName}.html"`,
        },
      });
    }

    const pdfBuffer = await generateProfilePDF(profile);
    if (!pdfBuffer) {
      const duration = Date.now() - start;
      logRequest("GET", "/api/pdf", 500, duration, user.id);
      return NextResponse.json(
        { error: "Failed to generate PDF" },
        { status: 500 }
      );
    }

    const duration = Date.now() - start;
    logRequest("GET", "/api/pdf", 200, duration, user.id);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ficha-inquilino-${profile.personalInfo.lastName}.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("GET", "/api/pdf", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("GET", "/api/pdf", 500, duration);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
