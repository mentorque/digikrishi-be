import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import * as elasticsearchService from '../services/elasticsearch.service.js';
import * as farmerService from '../services/farmer.service.js';

export async function search(req: Request, res: Response) {
  const tenantId = (req as any).user.tenant_id;
  const query = (req.query.query as string) ?? '';
  const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));

  let ids: string[];
  let total: number;

  if (env.ELASTICSEARCH_NODE) {
    try {
      const out = await elasticsearchService.searchFarmers(query, tenantId, page, limit);
      ids = out.ids;
      total = out.total;
    } catch {
      const out = await farmerService.searchFarmersFallback(query, tenantId, page, limit);
      ids = out.ids;
      total = out.total;
    }
  } else {
    const out = await farmerService.searchFarmersFallback(query, tenantId, page, limit);
    ids = out.ids;
    total = out.total;
  }

  const results = await farmerService.getByIds(ids, tenantId);
  res.json({ results, total, page, limit });
}
