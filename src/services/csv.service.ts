import { CsvUploadJob } from '../models/index.js';

export async function createJob(
  tenantId: string,
  fileName: string,
  options: { totalRows?: number; s3Key?: string } = {}
) {
  const job = await CsvUploadJob.create({
    tenant_id: tenantId,
    file_name: fileName,
    total_rows: options.totalRows ?? 0,
    status: 'PROCESSING',
    s3_key: options.s3Key ?? null,
  });
  return job;
}

export async function getJobStatus(jobId: string, tenantId: string) {
  const job = await CsvUploadJob.findOne({
    where: { id: jobId, tenant_id: tenantId },
  });
  if (!job) {
    const err = new Error('Job not found') as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  return job;
}

export async function incrementJobCounts(jobId: string, successDelta = 0, failedDelta = 0) {
  const job = await CsvUploadJob.findByPk(jobId);
  if (!job) return;
  await job.increment({
    success_rows: successDelta,
    failed_rows: failedDelta,
  });
}

export async function setJobCompleted(jobId: string) {
  await CsvUploadJob.update({ status: 'COMPLETED' }, { where: { id: jobId } });
}

export async function setJobFailed(jobId: string) {
  await CsvUploadJob.update({ status: 'FAILED' }, { where: { id: jobId } });
}
