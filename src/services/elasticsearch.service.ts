import { elasticsearchClient, FARMERS_INDEX } from '../config/elasticsearch.js';
import logger from '../utils/logger.js';

const farmersMapping = {
  properties: {
    name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
    email: { type: 'keyword' },
    mobile: { type: 'keyword' },
    district: { type: 'keyword' },
    state: { type: 'keyword' },
    village: { type: 'text', fields: { keyword: { type: 'keyword' } } },
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
      mappings: farmersMapping as any,
    });
    logger.info(`Elasticsearch index "${FARMERS_INDEX}" created`);
  }
}

export function toFarmerDoc(farmer: any, address: any, profile: any) {
  return {
    farmer_id: farmer.id,
    tenant_id: farmer.tenant_id,
    name: farmer.name ?? '',
    email: farmer.email ?? (farmer.User?.email ?? ''),
    mobile: farmer.mobile ?? (farmer.User?.mobile ?? ''),
    district: address?.district ?? '',
    state: address?.state ?? '',
    village: address?.village ?? '',
    fpc: profile?.fpc ?? '',
    farmer_code: farmer.farmer_code ?? '',
  };
}

export async function indexFarmer(farmer: any, address: any = null, profile: any = null) {
  const doc = toFarmerDoc(farmer, address, profile);
  await elasticsearchClient.index({
    index: FARMERS_INDEX,
    id: farmer.id,
    document: doc,
  });
}

export async function bulkIndexFarmers(farmers: any[]) {
  if (!farmers.length) return;
  const body = farmers.flatMap((f) => [
    { index: { _index: FARMERS_INDEX, _id: f.id } },
    toFarmerDoc(f, f.FarmerAddress, f.FarmerProfileDetail),
  ]);
  await elasticsearchClient.bulk({ refresh: true, operations: body });
}


export async function searchFarmers(
  query: string,
  tenantId: string,
  page = 1,
  limit = 20
): Promise<{ ids: string[]; total: number }> {
  const from = (page - 1) * limit;
  const must: any[] = [{ term: { tenant_id: tenantId } }];
  const q = query?.trim() ?? '';
  if (q) {
    must.push({
      bool: {
        should: [
          // Full name or first/last name, fuzzy (typo-tolerant)
          { match: { name: { query: q, fuzziness: 'AUTO' } } },
          // Phrase prefix: "Raghav" -> "Raghavendra Gowda01"
          { match_phrase_prefix: { name: { query: q } } },
          // Exact farmer code
          { term: { farmer_code: q } },
          // Prefix on farmer code: "F50" matches "F5001", "F5023"
          { prefix: { farmer_code: q } },
          // Exact farmer id (UUID)
          { term: { farmer_id: q } },
          // Village, fuzzy
          { match: { village: { query: q, fuzziness: 'AUTO' } } },
          { term: { email: q } },
          { term: { mobile: q } },
        ],
        minimum_should_match: 1,
      },
    });
  }
  const result = await elasticsearchClient.search({
    index: FARMERS_INDEX,
    from,
    size: limit,
    query: { bool: { must } } as any,
  });
  const hits = result.hits.hits as Array<{ _id: string }>;
  const total =
    typeof result.hits.total === 'number'
      ? result.hits.total
      : (result.hits.total as any)?.value ?? 0;
  return { ids: hits.map((h) => h._id), total };
}
