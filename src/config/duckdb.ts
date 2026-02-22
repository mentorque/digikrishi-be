import { env } from './env.js';

async function createDuckDbConnection(): Promise<unknown> {
  const duckdb = (await import('duckdb')).default;
  return new Promise((resolve, reject) => {
    const db = new duckdb.Database(env.DUCKDB_PATH, (err: Error | null) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

export async function getDuckDbConnection(): Promise<unknown> {
  const db = await createDuckDbConnection() as { connect: () => unknown };
  // duckdb Node API: connect() returns the connection synchronously (no callback)
  return db.connect();
}

export { createDuckDbConnection };
