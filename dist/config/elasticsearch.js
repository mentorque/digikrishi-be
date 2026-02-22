import { Client } from '@elastic/elasticsearch';
import { env } from './env.js';
const elasticsearchClient = new Client({
    node: env.ELASTICSEARCH_NODE,
});
export const FARMERS_INDEX = 'farmers';
export { elasticsearchClient };
//# sourceMappingURL=elasticsearch.js.map