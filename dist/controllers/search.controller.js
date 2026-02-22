import * as elasticsearchService from '../services/elasticsearch.service.js';
import * as farmerService from '../services/farmer.service.js';
export async function search(req, res) {
    const tenantId = req.user.tenant_id;
    const query = req.query.query ?? '';
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
    const { ids, total } = await elasticsearchService.searchFarmers(query, tenantId, page, limit);
    const results = await farmerService.getByIds(ids, tenantId);
    res.json({ results, total, page, limit });
}
//# sourceMappingURL=search.controller.js.map