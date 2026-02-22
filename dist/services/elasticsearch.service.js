import { elasticsearchClient, FARMERS_INDEX } from '../config/elasticsearch.js';
import logger from '../utils/logger.js';
const farmersMapping = {
    properties: {
        name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
        email: { type: 'keyword' },
        mobile: { type: 'keyword' },
        district: { type: 'keyword' },
        state: { type: 'keyword' },
        fpc: { type: 'keyword' },
        farmer_code: { type: 'keyword' },
        tenant_id: { type: 'keyword' },
        farmer_id: { type: 'keyword' },
    },
};
export async function ensureFarmersIndex() {
    const exists = await elasticsearchClient.indices.exists({ index: FARMERS_INDEX });
    if (!exists) {
        await elasticsearchClient.indices.create({
            index: FARMERS_INDEX,
            mappings: farmersMapping,
        });
        logger.info(`Elasticsearch index "${FARMERS_INDEX}" created`);
    }
}
export function toFarmerDoc(farmer, address, profile) {
    return {
        farmer_id: farmer.id,
        tenant_id: farmer.tenant_id,
        name: farmer.name ?? '',
        email: farmer.email ?? (farmer.User?.email ?? ''),
        mobile: farmer.mobile ?? (farmer.User?.mobile ?? ''),
        district: address?.district ?? '',
        state: address?.state ?? '',
        fpc: profile?.fpc ?? '',
        farmer_code: farmer.farmer_code ?? '',
    };
}
export async function indexFarmer(farmer, address = null, profile = null) {
    const doc = toFarmerDoc(farmer, address, profile);
    await elasticsearchClient.index({
        index: FARMERS_INDEX,
        id: farmer.id,
        document: doc,
    });
}
export async function bulkIndexFarmers(farmers) {
    if (!farmers.length)
        return;
    const body = farmers.flatMap((f) => [
        { index: { _index: FARMERS_INDEX, _id: f.id } },
        toFarmerDoc(f, f.FarmerAddress, f.FarmerProfileDetails),
    ]);
    await elasticsearchClient.bulk({ refresh: true, operations: body });
}
export async function searchFarmers(query, tenantId, page = 1, limit = 20) {
    const from = (page - 1) * limit;
    const must = [{ term: { tenant_id: tenantId } }];
    if (query && query.trim()) {
        must.push({
            bool: {
                should: [
                    { match: { name: { query, fuzziness: 'AUTO' } } },
                    { term: { email: query } },
                    { term: { mobile: query } },
                    { term: { farmer_code: query } },
                ],
                minimum_should_match: 1,
            },
        });
    }
    const result = await elasticsearchClient.search({
        index: FARMERS_INDEX,
        from,
        size: limit,
        query: { bool: { must } },
    });
    const hits = result.hits.hits;
    const total = typeof result.hits.total === 'number' ? result.hits.total : result.hits.total?.value ?? 0;
    return { hits: hits.map((h) => ({ id: h._id, ...h._source })), total };
}
//# sourceMappingURL=elasticsearch.service.js.map