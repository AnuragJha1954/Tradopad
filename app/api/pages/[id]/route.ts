import { NextRequest, NextResponse } from "next/server";
import { getPage, updatePage, deletePage } from "@/lib/store";
import { PageIdParamSchema, UpdatePageInputSchema } from "@/lib/schema";

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

    const page = await getPage(paramValidation.data.id);
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error: unknown) {
    console.error("GET /api/pages/:id error:", error);
    return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const rawParams = await context.params;
    const paramValidation = PageIdParamSchema.safeParse(rawParams);
    if (!paramValidation.success) {
      return NextResponse.json({ error: "Invalid page ID" }, { status: 400 });
    }

    const body = await request.json();
    const bodyValidation = UpdatePageInputSchema.safeParse(body);
    if (!bodyValidation.success) {
      return NextResponse.json(
        { error: "Invalid update payload", details: bodyValidation.error.flatten() },
        { status: 400 }
      );
    }

    const result = await updatePage(paramValidation.data.id, bodyValidation.data);
    if (!result) {
      return NextResponse.json({ error: "Page not found or archived" }, { status: 404 });
    }

    return NextResponse.json({ success: true, updated_at: result.updated_at });
  } catch (error: unknown) {
    console.error("PATCH /api/pages/:id error:", error);
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const rawParams = await context.params;
    const paramValidation = PageIdParamSchema.safeParse(rawParams);
    if (!paramValidation.success) {
      return NextResponse.json({ error: "Invalid page ID" }, { status: 400 });
    }

    const deleted = await deletePage(paramValidation.data.id);
    if (!deleted) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("DELETE /api/pages/:id error:", error);
    return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
  }
}
