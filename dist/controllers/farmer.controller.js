import * as farmerService from '../services/farmer.service.js';
export async function list(req, res) {
    const tenantId = req.user.tenant_id;
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
    const { farmers, total } = await farmerService.getPaginated(tenantId, page, limit);
    res.json({ farmers, total, page, limit });
}
export async function getOne(req, res) {
    const id = String(req.params.id ?? '');
    const farmer = await farmerService.getById(id, req.user.tenant_id);
    res.json(farmer);
}
export async function create(req, res) {
    const tenantId = req.user.tenant_id;
    const agentId = req.user.role === 'FIELD_OFFICER' ? req.user.id : null;
    const farmer = await farmerService.create(req.body, tenantId, agentId);
    res.status(201).json(farmer);
}
export async function update(req, res) {
    const id = String(req.params.id ?? '');
    const farmer = await farmerService.update(id, req.user.tenant_id, req.body);
    res.json(farmer);
}
export async function remove(req, res) {
    const id = String(req.params.id ?? '');
    await farmerService.softDelete(id, req.user.tenant_id);
    res.json({ message: 'Farmer deactivated successfully' });
}
//# sourceMappingURL=farmer.controller.js.map