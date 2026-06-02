import { NextRequest, NextResponse } from "next/server";
import { getTenantProfileByUser } from "@/lib/tenant-profile";
import { generateProfilePDF, generateProfileHTML } from "@/lib/pdf-generator";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const format = searchParams.get("format") || "pdf";

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const profile = getTenantProfileByUser(userId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

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

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ficha-inquilino-${profile.personalInfo.lastName}.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
