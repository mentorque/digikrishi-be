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
  console.log('Starting Digi-Krishi backend...');

  try {
    console.log('Connecting to PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
  } catch (err: any) {
    logger.error('PostgreSQL connection failed', { error: err?.message });
    console.error('❌ PostgreSQL failed:', err?.message);
    process.exit(1);
  }

  try {
    console.log('Syncing database schema...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database schema synced');
  } catch (err: any) {
    logger.error('Sequelize sync failed', { error: err?.message });
    console.error('❌ Sync failed:', err?.message);
    process.exit(1);
  }

  try {
    console.log('Connecting to Redis...');
    await redis.ping();
    console.log(`✅ Redis (BullMQ) ready at ${env.REDIS_HOST}:${env.REDIS_PORT}`);
  } catch (err: any) {
    logger.warn('Redis unreachable – CSV job queue will not work', { error: err?.message });
    console.warn('⚠️ Redis unreachable – CSV queue will not work');
  }

  const port = Number(env.PORT);
  app.listen(port, '0.0.0.0', () => {
    console.log(`\n✅ Server is running at http://localhost:${port}`);
    console.log(`✅ Bull Board at http://localhost:${port}/admin/queues\n`);

    const duckDbTimeout = 5000;
    Promise.race([
      getDuckDbConnection(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), duckDbTimeout)
      ),
    ])
      .then((conn: any) => {
        if (conn && typeof conn.close === 'function') conn.close();
        console.log(
          `✅ DuckDB ready (${env.DUCKDB_PATH === ':memory:' ? 'in-memory' : env.DUCKDB_PATH})`
        );
      })
      .catch((err: any) => {
        const msg = err?.message ?? String(err);
        logger.warn('DuckDB connection failed – analytics may fail', { error: msg });
        console.log(`⚠️ DuckDB failed – analytics may fail: ${msg}`);
      });

    ensureFarmersIndex()
      .then(() => {
        console.log(`✅ Elasticsearch ready at ${env.ELASTICSEARCH_NODE}`);
      })
      .catch((err: any) => {
        const msg =
          err?.message ?? err?.reason ?? err?.meta?.body?.error?.reason ?? String(err);
        logger.warn('Elasticsearch index ensure failed', {
          error: msg || 'Elasticsearch unreachable (is it running?)',
        });
      });
  });
}

start().catch((err: any) => {
  logger.error('Startup failed', { error: err?.message });
  process.exit(1);
});
