import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { s3 } from '../config/s3.js';
import { env } from '../config/env.js';

const PRESIGN_UPLOAD_EXPIRES_IN = 300; // 5 min
const PRESIGN_DOWNLOAD_EXPIRES_IN = 60; // 1 min for view/download

export async function generateUploadUrl(options: {
  folder: string;
  contentType: string;
  fileName?: string;
}): Promise<{ uploadUrl: string; key: string }> {
  const ext = options.fileName?.includes('.') ? options.fileName.replace(/^.*\./, '') : '';
  const key = `${env.AWS_S3_BASE_PATH}/${options.folder}/${randomUUID()}${ext ? `.${ext}` : ''}`;

  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    ContentType: options.contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: PRESIGN_UPLOAD_EXPIRES_IN });
  return { uploadUrl, key };
}

/** Generate only the S3 key (for server-side upload). */
export function generateUploadKey(options: { folder: string; fileName?: string }): string {
  const ext = options.fileName?.includes('.') ? options.fileName.replace(/^.*\./, '') : '';
  return `${env.AWS_S3_BASE_PATH}/${options.folder}/${randomUUID()}${ext ? `.${ext}` : ''}`;
}

/** Upload a buffer to S3 from the server (no presigned URL; avoids CORS). */
export async function uploadBuffer(options: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: options.key,
    Body: options.body,
    ContentType: options.contentType,
  });
  await s3.send(command);
}

/** Generate a signed GET URL for downloading/viewing an S3 object by key. */
export async function generateDownloadUrl(key: string): Promise<{ url: string }> {
  const command = new GetObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key });
  const url = await getSignedUrl(s3, command, { expiresIn: PRESIGN_DOWNLOAD_EXPIRES_IN });
  return { url };
}
