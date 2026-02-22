import { env } from './env.js';
async function createDuckDbConnection() {
    const duckdb = (await import('duckdb')).default;
    return new Promise((resolve, reject) => {
        const db = new duckdb.Database(env.DUCKDB_PATH, (err) => {
            if (err)
                reject(err);
            else
                resolve(db);
        });
    });
}
export async function getDuckDbConnection() {
    const db = await createDuckDbConnection();
    return new Promise((resolve, reject) => {
        db.connect((err, connection) => {
            if (err)
                reject(err);
            else
                resolve(connection);
        });
    });
}
export { createDuckDbConnection };
//# sourceMappingURL=duckdb.js.map