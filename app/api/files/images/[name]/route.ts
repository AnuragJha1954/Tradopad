import { NextRequest, NextResponse } from "next/server";
import { b2GetObject } from "@/lib/b2";
import { ImageParamSchema } from "@/lib/schema";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ name: string }>;
};

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const rawParams = await context.params;
    const validation = ImageParamSchema.safeParse(rawParams);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid image filename" }, { status: 400 });
    }

    const { name } = validation.data;
    const relativeKey = `images/${name}`;

    const objectData = await b2GetObject(relativeKey);
    if (!objectData) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const ext = name.split(".").pop()?.toLowerCase() || "jpg";
    const contentType = objectData.contentType || MIME_MAP[ext] || "application/octet-stream";

    // Convert to Buffer and Uint8Array for Response stream
    const buffer = Buffer.from(objectData.body);

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/files/images/:name error:", error);
    return NextResponse.json(
      { error: "Failed to stream image" },
      { status: 500 }
    );
  }
}
