import * as elasticsearchService from '../services/elasticsearch.service.js';
export async function search(req, res) {
    const tenantId = req.user.tenant_id;
    const query = req.query.query ?? '';
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
    const { hits, total } = await elasticsearchService.searchFarmers(query, tenantId, page, limit);
    res.json({ results: hits, total, page, limit });
}
//# sourceMappingURL=search.controller.js.map