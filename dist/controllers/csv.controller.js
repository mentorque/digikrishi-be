import { csvQueue } from '../queues/csvQueue.js';
import * as csvService from '../services/csv.service.js';
export async function upload(req, res) {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const tenantId = req.user.tenant_id;
    const agentId = req.user.role === 'FIELD_OFFICER' ? req.user.id : null;
    const fileName = req.file.originalname;
    const filePath = req.file.path;
    const job = await csvService.createJob(tenantId, fileName, 0);
    await csvQueue.add('process-csv', { jobId: job.id, filePath, tenantId, agentId }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
    });
    return res.status(202).json({ message: 'Upload accepted', jobId: job.id });
}
export async function status(req, res) {
    const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
    const job = await csvService.getJobStatus(jobId, req.user.tenant_id);
    res.json(job);
}
//# sourceMappingURL=csv.controller.js.map