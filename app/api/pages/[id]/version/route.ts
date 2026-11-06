import { NextRequest, NextResponse } from "next/server";
import { getPageVersion } from "@/lib/store";
import { PageIdParamSchema } from "@/lib/schema";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const rawParams = await context.params;
    const paramValidation = PageIdParamSchema.safeParse(rawParams);
    if (!paramValidation.success) {
      return NextResponse.json({ error: "Invalid page ID" }, { status: 400 });
    }

    const updatedAt = await getPageVersion(paramValidation.data.id);
    if (!updatedAt) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({ updated_at: updatedAt });
  } catch (error: unknown) {
    console.error("GET /api/pages/:id/version error:", error);
    return NextResponse.json(
      { error: "Failed to fetch page version" },
      { status: 500 }
    );
  }
}
