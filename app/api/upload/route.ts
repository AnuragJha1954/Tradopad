import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { b2PutObject } from "@/lib/b2";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB cap

function detectImageFormat(buffer: Buffer): { ext: string; mime: string } | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { ext: "png", mime: "image/png" };
  }

  // GIF: 47 49 46 38 (GIF87a or GIF89a)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return { ext: "gif", mime: "image/gif" };
  }

  // WebP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { ext: "webp", mime: "image/webp" };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No image file provided in form-data ('file')" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 4 MB limit" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate actual file bytes (magic numbers)
    const detected = detectImageFormat(buffer);
    if (!detected) {
      return NextResponse.json(
        { error: "Invalid image format. Allowed formats: JPEG, PNG, WebP, GIF." },
        { status: 400 }
      );
    }

    const imageId = randomUUID();
    const fileName = `${imageId}.${detected.ext}`;
    const relativeKey = `images/${fileName}`;

    // Upload to Backblaze B2 under prefix/images/...
    await b2PutObject(relativeKey, buffer, detected.mime);

    return NextResponse.json({
      url: `/api/files/images/${fileName}`,
    });
  } catch (error: unknown) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
