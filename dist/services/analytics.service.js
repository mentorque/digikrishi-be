import path from 'path';
import { fileURLToPath } from 'url';
import duckdb from 'duckdb';
import { env } from '../config/env.js';
import { Farmer, FarmerAddress, FarmerProfileDetails, FarmerAgentMap, } from '../models/index.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function createDuckDb() {
    return new Promise((resolve, reject) => {
        const db = new duckdb.Database(env.DUCKDB_PATH, (err) => {
            if (err)
                reject(err);
            else
                resolve(db);
        });
    });
}
function runQuery(conn, sql, params = []) {
    return new Promise((resolve, reject) => {
        conn.all(sql, ...params, (err, result) => {
            if (err)
                reject(err);
            else
                resolve(result);
        });
    });
}
async function syncToDuckDb(tenantId) {
    const db = await createDuckDb();
    const conn = db.connect();
    const farmers = await Farmer.findAll({
        where: tenantId ? { tenant_id: tenantId } : {},
        include: [
            { model: FarmerAddress, as: 'FarmerAddress', required: false },
            { model: FarmerProfileDetails, as: 'FarmerProfileDetails', required: false },
        ],
    });
    await runQuery(conn, 'CREATE OR REPLACE TABLE farmers (id VARCHAR, tenant_id VARCHAR, name VARCHAR, gender VARCHAR, dob DATE, education VARCHAR, kyc_status VARCHAR, is_activated BOOLEAN, created_by_agent_id VARCHAR, farmer_code VARCHAR, created_at TIMESTAMP)');
    await runQuery(conn, 'CREATE OR REPLACE TABLE farmer_addresses (id VARCHAR, farmer_id VARCHAR, village VARCHAR, taluka VARCHAR, district VARCHAR, state VARCHAR, pincode VARCHAR, landmark VARCHAR)');
    await runQuery(conn, 'CREATE OR REPLACE TABLE farmer_profile_details (id VARCHAR, farmer_id VARCHAR, fpc VARCHAR, shg VARCHAR, caste VARCHAR, social_category VARCHAR, ration_card BOOLEAN)');
    await runQuery(conn, 'CREATE OR REPLACE TABLE farmer_agent_map (id VARCHAR, farmer_id VARCHAR, agent_id VARCHAR, assigned_at TIMESTAMP)');
    for (const f of farmers) {
        await runQuery(conn, `INSERT INTO farmers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
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
            f.created_at,
        ]);
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
        if (f.FarmerProfileDetails) {
            const p = f.FarmerProfileDetails;
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
    return conn;
}
export async function getSummary(tenantId) {
    const conn = await syncToDuckDb(tenantId);
    const totalResult = await runQuery(conn, 'SELECT COUNT(*) as total FROM farmers');
    const total = totalResult[0]?.total ?? 0;
    const activatedResult = await runQuery(conn, 'SELECT COUNT(*) as c FROM farmers WHERE is_activated = true');
    const activated = activatedResult[0]?.c ?? 0;
    const kycResult = await runQuery(conn, "SELECT COUNT(*) as c FROM farmer_profile_details WHERE social_category IS NOT NULL AND social_category != ''");
    const kycCount = kycResult[0]?.c ?? 0;
    conn.close();
    return {
        total_farmers: total,
        activated_percent: total ? Math.round((activated / total) * 10000) / 100 : 0,
        kyc_completion_percent: total ? Math.round((kycCount / total) * 10000) / 100 : 0,
    };
}
export async function getByDistrict(tenantId) {
    const conn = await syncToDuckDb(tenantId);
    const result = await runQuery(conn, `SELECT a.district, COUNT(f.id) as count FROM farmers f
     LEFT JOIN farmer_addresses a ON f.id = a.farmer_id
     GROUP BY a.district ORDER BY count DESC`);
    conn.close();
    return result;
}
export async function getByState(tenantId) {
    const conn = await syncToDuckDb(tenantId);
    const result = await runQuery(conn, `SELECT a.state, COUNT(f.id) as count FROM farmers f
     LEFT JOIN farmer_addresses a ON f.id = a.farmer_id
     GROUP BY a.state ORDER BY count DESC`);
    conn.close();
    return result;
}
export async function getByAgent(tenantId) {
    const conn = await syncToDuckDb(tenantId);
    const result = await runQuery(conn, `SELECT agent_id, COUNT(*) as count FROM farmer_agent_map
     GROUP BY agent_id ORDER BY count DESC`);
    conn.close();
    return result;
}
export async function getBySocialCategory(tenantId) {
    const conn = await syncToDuckDb(tenantId);
    const result = await runQuery(conn, `SELECT p.social_category, COUNT(*) as count FROM farmer_profile_details p
     JOIN farmers f ON p.farmer_id = f.id
     GROUP BY p.social_category ORDER BY count DESC`);
    conn.close();
    return result;
}
//# sourceMappingURL=analytics.service.js.map