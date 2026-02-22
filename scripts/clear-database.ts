/**
 * Clears all data except users and tenants.
 * Run from project root: npx tsx scripts/clear-database.ts
 *
 * Tables truncated (users and tenants are kept):
 *   otp_logs, farmer_agent_map, farmer_lands, farmer_profile_details,
 *   farmer_addresses, farmers, csv_upload_jobs
 */

import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME ?? '',
  process.env.DB_USER ?? '',
  process.env.DB_PASSWORD ?? '',
  {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: false,
  }
);

const TABLES = [
  'otp_logs',
  'farmer_agent_map',
  'farmer_lands',
  'farmer_profile_details',
  'farmer_addresses',
  'farmer_docs',
  'farmers',
  'csv_upload_jobs',
] as const;

async function main() {
  try {
    await sequelize.authenticate();
  } catch (e) {
    console.error('Database connection failed:', e);
    process.exit(1);
  }

  const tableList = TABLES.join(', ');
  await sequelize.query(
    `TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`
  );

  console.log('Cleared data from:', tableList);
  console.log('Kept: users, tenants');
  await sequelize.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
