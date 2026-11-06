import { NextRequest, NextResponse } from "next/server";
import { getIndex, createPage } from "@/lib/store";
import { CreatePageInputSchema } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const index = await getIndex();
    return NextResponse.json(index);
  } catch (error: unknown) {
    console.error("GET /api/pages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pages index" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional when creating empty page
    }

    const validated = CreatePageInputSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid page creation payload", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const page = await createPage(
      validated.data.title || "",
      validated.data.icon || null
    );

    return NextResponse.json(page, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/pages error:", error);
    return NextResponse.json(
      { error: "Failed to create page" },
      { status: 500 }
    );
  }
}
