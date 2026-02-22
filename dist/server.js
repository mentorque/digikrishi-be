import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';
import { env } from './config/env.js';
import { sequelize } from './models/index.js';
import { redis } from './config/redis.js';
import { getDuckDbConnection } from './config/duckdb.js';
import { ensureFarmersIndex } from './services/elasticsearch.service.js';
import logger from './utils/logger.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}
const uploadDir = path.resolve(__dirname, '..', env.CSV_UPLOAD_PATH);
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
async function start() {
    try {
        await sequelize.authenticate();
        logger.info('PostgreSQL connected');
    }
    catch (err) {
        logger.error('PostgreSQL connection failed', { error: err?.message });
        process.exit(1);
    }
    try {
        await sequelize.sync({ alter: true });
        logger.info('Sequelize models synced');
    }
    catch (err) {
        logger.error('Sequelize sync failed', { error: err?.message });
        process.exit(1);
    }
    try {
        await redis.ping();
        console.log(`✅ Redis (BullMQ) ready at ${env.REDIS_HOST}:${env.REDIS_PORT}`);
    }
    catch (err) {
        logger.warn('Redis unreachable – CSV job queue will not work', { error: err?.message });
    }
    const port = Number(env.PORT);
    app.listen(port, '0.0.0.0', () => {
        logger.info(`Server listening on port ${port}`);
        console.log(`\n✅ Server is running at http://localhost:${port}`);
        console.log(`✅ Bull Board at http://localhost:${port}/admin/queues\n`);
        const duckDbTimeout = 5000;
        Promise.race([
            getDuckDbConnection(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), duckDbTimeout)),
        ])
            .then((conn) => {
            if (conn && typeof conn.close === 'function')
                conn.close();
            console.log(`✅ DuckDB ready (${env.DUCKDB_PATH === ':memory:' ? 'in-memory' : env.DUCKDB_PATH})`);
        })
            .catch((err) => {
            const msg = err?.message ?? String(err);
            logger.warn('DuckDB connection failed – analytics may fail', { error: msg });
            console.log(`⚠️ DuckDB failed – analytics may fail: ${msg}`);
        });
        ensureFarmersIndex()
            .then(() => {
            console.log(`✅ Elasticsearch ready at ${env.ELASTICSEARCH_NODE}`);
        })
            .catch((err) => {
            const msg = err?.message ?? err?.reason ?? err?.meta?.body?.error?.reason ?? String(err);
            logger.warn('Elasticsearch index ensure failed', {
                error: msg || 'Elasticsearch unreachable (is it running?)',
            });
        });
    });
}
start().catch((err) => {
    logger.error('Startup failed', { error: err?.message });
    process.exit(1);
});
//# sourceMappingURL=server.js.map