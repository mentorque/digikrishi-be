import * as analyticsService from '../services/analytics.service.js';
export async function summary(req, res) {
    const tenantId = req.user.tenant_id;
    const data = await analyticsService.getSummary(tenantId);
    res.json(data);
}
export async function byDistrict(req, res) {
    const tenantId = req.user.tenant_id;
    const data = await analyticsService.getByDistrict(tenantId);
    res.json(data);
}
export async function byState(req, res) {
    const tenantId = req.user.tenant_id;
    const data = await analyticsService.getByState(tenantId);
    res.json(data);
}
export async function byAgent(req, res) {
    const tenantId = req.user.tenant_id;
    const data = await analyticsService.getByAgent(tenantId);
    res.json(data);
}
export async function bySocialCategory(req, res) {
    const tenantId = req.user.tenant_id;
    const data = await analyticsService.getBySocialCategory(tenantId);
    res.json(data);
}
//# sourceMappingURL=analytics.controller.js.map