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
export async function byGender(req, res) {
    const tenantId = req.user.tenant_id;
    const data = await analyticsService.getByGender(tenantId);
    res.json(data);
}
export async function byEducation(req, res) {
    const tenantId = req.user.tenant_id;
    const data = await analyticsService.getByEducation(tenantId);
    res.json(data);
}
export async function byKycStatus(req, res) {
    const tenantId = req.user.tenant_id;
    const data = await analyticsService.getByKycStatus(tenantId);
    res.json(data);
}
export async function byCaste(req, res) {
    const tenantId = req.user.tenant_id;
    const data = await analyticsService.getByCaste(tenantId);
    res.json(data);
}
export async function byFpc(req, res) {
    const tenantId = req.user.tenant_id;
    const data = await analyticsService.getByFpc(tenantId);
    res.json(data);
}
export async function rationCardStats(req, res) {
    const tenantId = req.user.tenant_id;
    const data = await analyticsService.getRationCardStats(tenantId);
    res.json(data);
}
export async function byVillage(req, res) {
    const tenantId = req.user.tenant_id;
    const limit = Math.min(50, Math.max(5, parseInt(String(req.query.limit), 10) || 15));
    const data = await analyticsService.getByVillage(tenantId, limit);
    res.json(data);
}
export async function byTaluka(req, res) {
    const tenantId = req.user.tenant_id;
    const limit = Math.min(50, Math.max(5, parseInt(String(req.query.limit), 10) || 15));
    const data = await analyticsService.getByTaluka(tenantId, limit);
    res.json(data);
}
export async function byMonth(req, res) {
    const tenantId = req.user.tenant_id;
    const data = await analyticsService.getByMonth(tenantId);
    res.json(data);
}
//# sourceMappingURL=analytics.controller.js.map