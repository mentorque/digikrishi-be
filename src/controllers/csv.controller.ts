import type { Request, Response } from 'express';
import { csvQueue } from '../queues/csvQueue.js';
import * as csvService from '../services/csv.service.js';
import * as presignService from '../services/presign.service.js';
import { env } from '../config/env.js';

/** Pre-signed URL for direct upload to S3. Frontend PUTs file to uploadUrl then calls POST /csv/upload with { key, fileName }. */
export async function getPresignUrl(req: Request, res: Response) {
  if (!env.AWS_S3_BUCKET) {
    return res.status(503).json({ message: 'S3 upload not configured' });
  }
  const { uploadUrl, key } = await presignService.generateUploadUrl({
    folder: 'csv',
    contentType: 'text/csv',
    fileName: 'upload.csv',
  });
  return res.json({ uploadUrl, key });
}

/** Register an upload after frontend has PUT the file to S3. Body: { key, fileName }. */
export async function upload(req: Request, res: Response) {
  const tenantId = (req as any).user.tenant_id;
  const agentId = (req as any).user.role === 'FIELD_OFFICER' ? (req as any).user.id : null;
  const body = req.body as { key?: string; fileName?: string };
  const key = body?.key?.trim();
  const fileName = body?.fileName?.trim() || 'upload.csv';
  if (!key) {
    return res.status(400).json({ message: 'key is required' });
  }
  const job = await csvService.createJob(tenantId, fileName, { s3Key: key });
  await csvQueue.add(
    'process-csv',
    { jobId: job.id, s3Key: key, tenantId, agentId },
    { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
  );
  return res.status(202).json({ message: 'Upload accepted', jobId: job.id });
}

export async function status(req: Request, res: Response) {
  const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const job = await csvService.getJobStatus(jobId!, (req as any).user.tenant_id);
  res.json(job);
}
