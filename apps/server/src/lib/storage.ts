import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION || "us-east-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "mock-access-key";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "mock-secret-key";
const bucketName = process.env.AWS_S3_BUCKET || "job-portal-uploads";

export const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  // If in local dev, allow configuring custom S3 endpoint like LocalStack/MinIO
  endpoint: process.env.AWS_S3_ENDPOINT || undefined,
  forcePathStyle: !!process.env.AWS_S3_FORCE_PATH_STYLE,
});

/**
 * Generate a pre-signed URL for client-side uploads directly to S3
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<{ uploadUrl: string; key: string }> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return { uploadUrl, key };
}

/**
 * Generate a pre-signed URL for downloading a file from S3 (e.g. secure resume view)
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Directly upload file from backend memory to S3
 */
export async function uploadFileDirect(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3Client.send(command);
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}

export { bucketName };
