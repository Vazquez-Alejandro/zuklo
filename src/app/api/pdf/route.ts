import { NextRequest, NextResponse } from "next/server";
import { getTenantProfileByUser } from "@/lib/tenant-profile";
import { generateProfilePDF, generateProfileHTML } from "@/lib/pdf-generator";
import { checkFeatureAccess, incrementUsage } from "@/lib/monetization";
import { requireAuth } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "pdf";

    const access = await checkFeatureAccess(user.id, "tenantProfile");
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.reason },
        { status: 403 }
      );
    }

    const profile = getTenantProfileByUser(user.id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    await incrementUsage(user.id, "pdfExportsUsed");

    if (format === "html") {
      const html = generateProfileHTML(profile);
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="ficha-inquilino-${profile.personalInfo.lastName}.html"`,
        },
      });
    }

    const pdfBuffer = await generateProfilePDF(profile);
    if (!pdfBuffer) {
      return NextResponse.json(
        { error: "Failed to generate PDF" },
        { status: 500 }
      );
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ficha-inquilino-${profile.personalInfo.lastName}.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
