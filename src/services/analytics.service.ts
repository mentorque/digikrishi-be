import path from 'path';
import { fileURLToPath } from 'url';
import duckdb from 'duckdb';
import { env } from '../config/env.js';
import {
  Farmer,
  FarmerAddress,
  FarmerProfileDetails,
  FarmerAgentMap,
} from '../models/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Cache synced DuckDB per tenant so we don't re-sync on every request (was causing 1.5 min per request). */
const DUCKDB_CACHE_TTL_MS = 60 * 1000; // 1 minute
const duckDbCache = new Map<
  string,
  { db: any; conn: any; lastSync: number }
>();
/** So concurrent requests for same tenant wait for one sync instead of all running sync. */
const syncInProgress = new Map<string, Promise<any>>();

function cacheKey(tenantId: string | null): string {
  return tenantId ?? 'all';
}

/** Recursively convert BigInt to number so JSON.stringify works */
function sanitizeForJson(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeForJson);
  if (typeof obj === 'object' && obj.constructor === Object) {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) out[k] = sanitizeForJson(v);
    return out;
  }
  return obj;
}

function createDuckDb(): Promise<any> {
  return new Promise((resolve, reject) => {
    const db = new duckdb.Database(env.DUCKDB_PATH, (err: Error | null) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

function runQuery(conn: any, sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    conn.all(sql, ...params, (err: Error | null, result: any[]) => {
      if (err) reject(err);
      else resolve(sanitizeForJson(result));
    });
  });
}

async function performSync(tenantId: string | null): Promise<any> {
  const key = cacheKey(tenantId);
  const cached = duckDbCache.get(key);
  if (cached) {
    try {
      cached.conn.close();
      cached.db.close();
    } catch (_) {}
    duckDbCache.delete(key);
  }

  const db = await createDuckDb();
  const conn = db.connect();

  const farmers = await Farmer.findAll({
    where: tenantId ? { tenant_id: tenantId } : {},
    include: [
      { model: FarmerAddress, as: 'FarmerAddress', required: false },
      { model: FarmerProfileDetails, as: 'FarmerProfileDetail', required: false },
    ],
  });

  await runQuery(
    conn,
    `CREATE OR REPLACE TABLE farmers (
      id VARCHAR, tenant_id VARCHAR, name VARCHAR, gender VARCHAR, dob DATE, education VARCHAR,
      kyc_status VARCHAR, is_activated BOOLEAN, created_by_agent_id VARCHAR, farmer_code VARCHAR,
      profile_pic_url VARCHAR, created_at TIMESTAMP
    )`
  );
  await runQuery(
    conn,
    'CREATE OR REPLACE TABLE farmer_addresses (id VARCHAR, farmer_id VARCHAR, village VARCHAR, taluka VARCHAR, district VARCHAR, state VARCHAR, pincode VARCHAR, landmark VARCHAR)'
  );
  await runQuery(
    conn,
    'CREATE OR REPLACE TABLE farmer_profile_details (id VARCHAR, farmer_id VARCHAR, fpc VARCHAR, shg VARCHAR, caste VARCHAR, social_category VARCHAR, ration_card BOOLEAN)'
  );
  await runQuery(
    conn,
    'CREATE OR REPLACE TABLE farmer_agent_map (id VARCHAR, farmer_id VARCHAR, agent_id VARCHAR, assigned_at TIMESTAMP)'
  );

  for (const f of farmers) {
    await runQuery(
      conn,
      `INSERT INTO farmers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        f.id,
        f.tenant_id,
        f.name,
        f.gender,
        f.dob,
        f.education,
        f.kyc_status,
        f.is_activated,
        f.created_by_agent_id,
        f.farmer_code,
        (f as any).profile_pic_url ?? null,
        f.created_at,
      ]
    );
    if (f.FarmerAddress) {
      const a = f.FarmerAddress;
      await runQuery(conn, `INSERT INTO farmer_addresses VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
        a.id,
        a.farmer_id,
        a.village,
        a.taluka,
        a.district,
        a.state,
        a.pincode,
        a.landmark,
      ]);
    }
    if (f.FarmerProfileDetail) {
      const p = f.FarmerProfileDetail;
      await runQuery(conn, `INSERT INTO farmer_profile_details VALUES (?, ?, ?, ?, ?, ?, ?)`, [
        p.id,
        p.farmer_id,
        p.fpc,
        p.shg,
        p.caste,
        p.social_category,
        p.ration_card,
      ]);
    }
  }

  const agentMaps = await FarmerAgentMap.findAll({});
  for (const m of agentMaps) {
    await runQuery(conn, `INSERT INTO farmer_agent_map VALUES (?, ?, ?, ?)`, [
      m.id,
      m.farmer_id,
      m.agent_id,
      m.assigned_at,
    ]);
  }

  duckDbCache.set(key, { db, conn, lastSync: Date.now() });
  return conn;
}

async function syncToDuckDb(tenantId: string | null): Promise<any> {
  const key = cacheKey(tenantId);
  const cached = duckDbCache.get(key);
  if (cached && Date.now() - cached.lastSync < DUCKDB_CACHE_TTL_MS) {
    return cached.conn;
  }
  let promise = syncInProgress.get(key);
  if (promise) {
    return promise;
  }
  promise = performSync(tenantId);
  syncInProgress.set(key, promise);
  try {
    const conn = await promise;
    return conn;
  } finally {
    syncInProgress.delete(key);
  }
}

export async function getSummary(tenantId: string | null) {
  const conn = await syncToDuckDb(tenantId);
  const totalResult = await runQuery(conn, 'SELECT COUNT(*) as total FROM farmers');
  const total = Number(totalResult[0]?.total ?? 0);
  const activatedResult = await runQuery(
    conn,
    'SELECT COUNT(*) as c FROM farmers WHERE is_activated = true'
  );
  const activated = Number(activatedResult[0]?.c ?? 0);
  const kycResult = await runQuery(
    conn,
    "SELECT COUNT(*) as c FROM farmer_profile_details p JOIN farmers f ON p.farmer_id = f.id WHERE p.social_category IS NOT NULL AND p.social_category != ''"
  );
  const kycCount = Number(kycResult[0]?.c ?? 0);
  const withPicResult = await runQuery(
    conn,
    "SELECT COUNT(*) as c FROM farmers WHERE profile_pic_url IS NOT NULL AND profile_pic_url != ''"
  );
  const withProfilePic = Number(withPicResult[0]?.c ?? 0);
  return sanitizeForJson({
    total_farmers: total,
    activated_percent: total ? Math.round((activated / total) * 10000) / 100 : 0,
    kyc_completion_percent: total ? Math.round((kycCount / total) * 10000) / 100 : 0,
    with_profile_pic_count: withProfilePic,
    with_profile_pic_percent: total ? Math.round((withProfilePic / total) * 10000) / 100 : 0,
  });
}

export async function getByDistrict(tenantId: string | null) {
  const conn = await syncToDuckDb(tenantId);
  const result = await runQuery(
    conn,
    `SELECT COALESCE(a.district, '—') as district, CAST(COUNT(f.id) AS INTEGER) as count
     FROM farmers f LEFT JOIN farmer_addresses a ON f.id = a.farmer_id
     GROUP BY a.district ORDER BY count DESC`
  );
  return result;
}

export async function getByState(tenantId: string | null) {
  const conn = await syncToDuckDb(tenantId);
  const result = await runQuery(
    conn,
    `SELECT COALESCE(a.state, '—') as state, CAST(COUNT(f.id) AS INTEGER) as count
     FROM farmers f LEFT JOIN farmer_addresses a ON f.id = a.farmer_id
     GROUP BY a.state ORDER BY count DESC`
  );
  return result;
}

export async function getByAgent(tenantId: string | null) {
  const conn = await syncToDuckDb(tenantId);
  const result = await runQuery(
    conn,
    `SELECT agent_id, CAST(COUNT(*) AS INTEGER) as count FROM farmer_agent_map
     GROUP BY agent_id ORDER BY count DESC`
  );
  return result;
}

export async function getBySocialCategory(tenantId: string | null) {
  const conn = await syncToDuckDb(tenantId);
  const result = await runQuery(
    conn,
    `SELECT COALESCE(p.social_category, '—') as social_category, CAST(COUNT(*) AS INTEGER) as count
     FROM farmer_profile_details p JOIN farmers f ON p.farmer_id = f.id
     GROUP BY p.social_category ORDER BY count DESC`
  );
  return result;
}

export async function getByGender(tenantId: string | null) {
  const conn = await syncToDuckDb(tenantId);
  const result = await runQuery(
    conn,
    `SELECT COALESCE(gender, '—') as gender, CAST(COUNT(*) AS INTEGER) as count
     FROM farmers GROUP BY gender ORDER BY count DESC`
  );
  return result;
}

export async function getByEducation(tenantId: string | null) {
  const conn = await syncToDuckDb(tenantId);
  const result = await runQuery(
    conn,
    `SELECT COALESCE(education, '—') as education, CAST(COUNT(*) AS INTEGER) as count
     FROM farmers GROUP BY education ORDER BY count DESC`
  );
  return result;
}

export async function getByKycStatus(tenantId: string | null) {
  const conn = await syncToDuckDb(tenantId);
  const result = await runQuery(
    conn,
    `SELECT COALESCE(kyc_status, 'PENDING') as kyc_status, CAST(COUNT(*) AS INTEGER) as count
     FROM farmers GROUP BY kyc_status ORDER BY count DESC`
  );
  return result;
}

export async function getByCaste(tenantId: string | null) {
  const conn = await syncToDuckDb(tenantId);
  const result = await runQuery(
    conn,
    `SELECT COALESCE(p.caste, '—') as caste, CAST(COUNT(*) AS INTEGER) as count
     FROM farmer_profile_details p JOIN farmers f ON p.farmer_id = f.id
     GROUP BY p.caste ORDER BY count DESC`
  );
  return result;
}

export async function getByFpc(tenantId: string | null) {
  const conn = await syncToDuckDb(tenantId);
  const result = await runQuery(
    conn,
    `SELECT COALESCE(p.fpc, '—') as fpc, CAST(COUNT(*) AS INTEGER) as count
     FROM farmer_profile_details p JOIN farmers f ON p.farmer_id = f.id
     GROUP BY p.fpc ORDER BY count DESC`
  );
  return result;
}

export async function getRationCardStats(tenantId: string | null) {
  const conn = await syncToDuckDb(tenantId);
  const result = await runQuery(
    conn,
    `SELECT
       CAST(SUM(CASE WHEN p.ration_card = true THEN 1 ELSE 0 END) AS INTEGER) as with_ration_card,
       CAST(SUM(CASE WHEN p.ration_card = false OR p.ration_card IS NULL THEN 1 ELSE 0 END) AS INTEGER) as without_ration_card
     FROM farmers f
     LEFT JOIN farmer_profile_details p ON f.id = p.farmer_id`
  );
  return result[0] ?? { with_ration_card: 0, without_ration_card: 0 };
}

export async function getByVillage(tenantId: string | null, limit = 15) {
  const conn = await syncToDuckDb(tenantId);
  const result = await runQuery(
    conn,
    `SELECT COALESCE(a.village, '—') as village, CAST(COUNT(f.id) AS INTEGER) as count
     FROM farmers f LEFT JOIN farmer_addresses a ON f.id = a.farmer_id
     GROUP BY a.village ORDER BY count DESC LIMIT ?`,
    [limit]
  );
  return result;
}

export async function getByMonth(tenantId: string | null) {
  const conn = await syncToDuckDb(tenantId);
  const result = await runQuery(
    conn,
    `SELECT
       strftime('%Y-%m', created_at) as month,
       CAST(COUNT(*) AS INTEGER) as count
     FROM farmers
     WHERE created_at IS NOT NULL
     GROUP BY strftime('%Y-%m', created_at)
     ORDER BY month ASC`
  );
  return result;
}

export async function getByTaluka(tenantId: string | null, limit = 15) {
  const conn = await syncToDuckDb(tenantId);
  const result = await runQuery(
    conn,
    `SELECT COALESCE(a.taluka, '—') as taluka, CAST(COUNT(f.id) AS INTEGER) as count
     FROM farmers f LEFT JOIN farmer_addresses a ON f.id = a.farmer_id
     GROUP BY a.taluka ORDER BY count DESC LIMIT ?`,
    [limit]
  );
  return result;
}
