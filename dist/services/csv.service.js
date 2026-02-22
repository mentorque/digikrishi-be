import { CsvUploadJob } from '../models/index.js';
export async function createJob(tenantId, fileName, totalRows = 0) {
    const job = await CsvUploadJob.create({
        tenant_id: tenantId,
        file_name: fileName,
        total_rows: totalRows,
        status: 'PROCESSING',
    });
    return job;
}
export async function getJobStatus(jobId, tenantId) {
    const job = await CsvUploadJob.findOne({
        where: { id: jobId, tenant_id: tenantId },
    });
    if (!job) {
        const err = new Error('Job not found');
        err.status = 404;
        throw err;
    }
    return job;
}
export async function incrementJobCounts(jobId, successDelta = 0, failedDelta = 0) {
    const job = await CsvUploadJob.findByPk(jobId);
    if (!job)
        return;
    await job.increment({
        success_rows: successDelta,
        failed_rows: failedDelta,
    });
}
export async function setJobCompleted(jobId) {
    await CsvUploadJob.update({ status: 'COMPLETED' }, { where: { id: jobId } });
}
export async function setJobFailed(jobId) {
    await CsvUploadJob.update({ status: 'FAILED' }, { where: { id: jobId } });
}
//# sourceMappingURL=csv.service.js.map