import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { extractS3KeyFromUrl, generateS3Key } from "@/lib/utils/uploadUtils";
import type { PresignedUrlParams, PresignedUrlResult } from "@/types/upload";

// Lazy-initialized S3 client to avoid build-time errors when env vars are missing
let _s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_s3Client) {
    _s3Client = new S3Client({
      region: process.env.AWS_S3_REGION ?? "",
      credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return _s3Client;
}

function getBucket(): string {
  return process.env.AWS_S3_BUCKET_NAME ?? "";
}

function getRegion(): string {
  return process.env.AWS_S3_REGION ?? "";
}

/**
 * Generates a presigned PUT URL for direct browser-to-S3 upload.
 * Returns the presigned URL, the final public URL, and the S3 key.
 */
export async function generatePresignedUrl(
  params: PresignedUrlParams
): Promise<PresignedUrlResult> {
  const { context, userId, contentType, extension } = params;
  const s3Key = generateS3Key(context, userId, extension);

  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: s3Key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 300 });
  const publicUrl = `https://${getBucket()}.s3.${getRegion()}.amazonaws.com/${s3Key}`;

  return { presignedUrl, publicUrl, s3Key };
}

/**
 * Deletes a file from S3 given its public URL.
 * If the key cannot be extracted from the URL, logs a warning and returns.
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  const s3Key = extractS3KeyFromUrl(fileUrl);

  if (!s3Key) {
    console.warn(`[uploadService] Could not extract S3 key from URL: ${fileUrl}`);
    return;
  }

  const command = new DeleteObjectCommand({
    Bucket: getBucket(),
    Key: s3Key,
  });

  await getS3Client().send(command);
}
