import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Lazy-initialized S3 client to avoid build-time errors if env vars are evaluated statically
let s3ClientInstance: S3Client | null = null;

export function getB2Client(): S3Client {
  if (!s3ClientInstance) {
    const endpoint = process.env.B2_ENDPOINT || "https://s3.us-east-005.backblazeb2.com";
    const region = process.env.B2_REGION || "us-east-005";
    const accessKeyId = process.env.B2_KEY_ID;
    const secretAccessKey = process.env.B2_APPLICATION_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error("Missing Backblaze B2 credentials (B2_KEY_ID or B2_APPLICATION_KEY)");
    }

    s3ClientInstance = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return s3ClientInstance;
}

export const B2_BUCKET = process.env.B2_BUCKET || "tradeengine";
export const B2_PREFIX = process.env.B2_PREFIX || "cofounder-tracker/";

export function getFullKey(relativeKey: string): string {
  const cleanRelative = relativeKey.startsWith("/") ? relativeKey.slice(1) : relativeKey;
  const cleanPrefix = B2_PREFIX.endsWith("/") ? B2_PREFIX : `${B2_PREFIX}/`;
  return `${cleanPrefix}${cleanRelative}`;
}

export async function b2GetObject(relativeKey: string): Promise<{
  body: Uint8Array;
  contentType?: string;
  metadata?: Record<string, string>;
} | null> {
  const client = getB2Client();
  const key = getFullKey(relativeKey);

  try {
    const command = new GetObjectCommand({
      Bucket: B2_BUCKET,
      Key: key,
    });
    const response = await client.send(command);
    if (!response.Body) return null;

    const byteArray = await response.Body.transformToByteArray();
    return {
      body: byteArray,
      contentType: response.ContentType,
      metadata: response.Metadata,
    };
  } catch (error: unknown) {
    const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw error;
  }
}

export async function b2PutObject(
  relativeKey: string,
  body: Buffer | Uint8Array | string,
  contentType = "application/json",
  metadata?: Record<string, string>
): Promise<void> {
  const client = getB2Client();
  const key = getFullKey(relativeKey);

  const command = new PutObjectCommand({
    Bucket: B2_BUCKET,
    Key: key,
    Body: typeof body === "string" ? Buffer.from(body, "utf-8") : body,
    ContentType: contentType,
    Metadata: metadata,
  });

  await client.send(command);
}

export async function b2HeadObject(relativeKey: string): Promise<{
  metadata?: Record<string, string>;
  lastModified?: Date;
  contentLength?: number;
  contentType?: string;
} | null> {
  const client = getB2Client();
  const key = getFullKey(relativeKey);

  try {
    const command = new HeadObjectCommand({
      Bucket: B2_BUCKET,
      Key: key,
    });
    const response = await client.send(command);
    return {
      metadata: response.Metadata,
      lastModified: response.LastModified,
      contentLength: response.ContentLength,
      contentType: response.ContentType,
    };
  } catch (error: unknown) {
    const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (err.name === "NotFound" || err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw error;
  }
}

export async function b2ListObjects(relativePrefix: string): Promise<string[]> {
  const client = getB2Client();
  const fullPrefix = getFullKey(relativePrefix);

  const command = new ListObjectsV2Command({
    Bucket: B2_BUCKET,
    Prefix: fullPrefix,
  });

  const response = await client.send(command);
  if (!response.Contents) return [];

  // Return relative keys without prefix
  return response.Contents.map((item) => {
    const key = item.Key || "";
    return key.startsWith(B2_PREFIX) ? key.slice(B2_PREFIX.length) : key;
  });
}
