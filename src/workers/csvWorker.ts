import { Readable } from 'stream';
import csv from 'csv-parser';
import { Worker } from 'bullmq';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env.js';
import { s3 } from '../config/s3.js';
import {
  sequelize,
  Farmer,
  FarmerAddress,
  FarmerProfileDetails,
  FarmerDoc,
  User,
  CsvUploadJob,
} from '../models/index.js';
import * as elasticsearchService from '../services/elasticsearch.service.js';
import * as csvService from '../services/csv.service.js';
import logger from '../utils/logger.js';

const connection = {
  host: env.REDIS_HOST,
  port: Number(env.REDIS_PORT),
};

/** Batch size for inserts: 100–1000 avoids memory spikes and locking; 100 is a safe default. */
const BATCH_SIZE = 100;

function validateRow(row: Record<string, string>) {
  const name = row.name || row.Name;
  const farmerCode = row.farmer_code || row.farmerCode || row['Farmer Code'];
  if (!name || !farmerCode) return { valid: false as const, error: 'name and farmer_code required' };
  return { valid: true as const, data: row };
}

async function processBatch(
  rows: Record<string, string>[],
  tenantId: string,
  agentId: string | null
) {
  let defaultUserId: string | null = null;
  const u = await User.findOne({ where: { tenant_id: tenantId, role: 'FARMER' } });
  if (u) defaultUserId = u.id;

  const farmersToCreate: any[] = [];
  const addressesToCreate: any[] = [];
  const profileDetailsToCreate: any[] = [];
  const docsToCreate: { pan_url: string | null; aadhaar_url: string | null }[] = [];

  for (const row of rows) {
    const { valid, data } = validateRow(row);
    if (!valid) continue;

    const name = data.name || data.Name;
    const farmerCode = String(
      data.farmer_code || data.farmerCode || data['Farmer Code']
    ).trim();
    const existing = await Farmer.findOne({
      where: { farmer_code: farmerCode, tenant_id: tenantId },
    });
    if (existing) continue;

    const profilePic =
      data.profile_pic_url ||
      data.profilePicUrl ||
      data['Profile Pic URL'] ||
      data['profile_pic_url'] ||
      null;

    farmersToCreate.push({
      farmer_code: farmerCode,
      user_id: defaultUserId || null,
      tenant_id: tenantId,
      name,
      gender: data.gender || data.Gender || null,
      dob: data.dob || data.DOB || null,
      education: data.education || data.Education || null,
      kyc_status: data.kyc_status || data.kycStatus || 'PENDING',
      is_activated: true,
      created_by_agent_id: agentId,
      profile_pic_url: profilePic || null,
    });
    addressesToCreate.push({
      village: data.village || data.Village || null,
      taluka: data.taluka || data.Taluka || null,
      district: data.district || data.District || null,
      state: data.state || data.State || null,
      pincode: data.pincode || data.Pincode || null,
      landmark: data.landmark || data.Landmark || null,
    });
    const rationVal: unknown = data.ration_card ?? data.rationCard ?? data['Ration Card'];
    const rationCard =
      rationVal === true ||
      rationVal === 'true' ||
      rationVal === '1' ||
      rationVal === 'yes' ||
      rationVal === 'Yes';
    profileDetailsToCreate.push({
      fpc: data.fpc || data.FPC || null,
      shg: data.shg || data.SHG || null,
      caste: data.caste || data.Caste || null,
      social_category:
        data.social_category || data.socialCategory || data['Social Category'] || null,
      ration_card: !!rationCard,
    });
    const panUrl =
      (data.pan_url || data.panUrl || data['PAN URL'] || '').trim() || null;
    const aadhaarUrl =
      (data.aadhaar_url || data.aadhaarUrl || data['Aadhaar URL'] || '').trim() || null;
    docsToCreate.push({ pan_url: panUrl || null, aadhaar_url: aadhaarUrl || null });
  }

  if (farmersToCreate.length === 0) return { success: 0, failed: rows.length };

  const created = await sequelize.transaction(async (t) => {
    const createdFarmers: any[] = [];
    for (let i = 0; i < farmersToCreate.length; i++) {
      const f = await Farmer.create(farmersToCreate[i], { transaction: t });
      await FarmerAddress.create(
        { ...addressesToCreate[i], farmer_id: f.id },
        { transaction: t }
      );
      await FarmerProfileDetails.create(
        { ...profileDetailsToCreate[i], farmer_id: f.id },
        { transaction: t }
      );
      const doc = docsToCreate[i];
      if (doc.pan_url || doc.aadhaar_url) {
        await FarmerDoc.create(
          { farmer_id: f.id, pan_url: doc.pan_url, aadhaar_url: doc.aadhaar_url },
          { transaction: t }
        );
      }
      createdFarmers.push(f);
    }
    return createdFarmers;
  });

  const withRelations = await Farmer.findAll({
    where: { id: created.map((f) => f.id) },
    include: [
      { model: FarmerAddress, as: 'FarmerAddress' },
      { model: FarmerProfileDetails, as: 'FarmerProfileDetail' },
    ],
  });

  await elasticsearchService.bulkIndexFarmers(withRelations);

  return { success: created.length, failed: rows.length - created.length };
}

async function streamCsvRows(s3Key: string): Promise<Record<string, string>[]> {
  const cmd = new GetObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: s3Key });
  const res = await s3.send(cmd);
  if (!res.Body) throw new Error('Empty S3 object');
  const rows: Record<string, string>[] = [];
  const stream = res.Body as Readable;
  await new Promise<void>((resolve, reject) => {
    stream
      .pipe(csv({ mapHeaders: ({ header }: { header: string }) => header.trim() }))
      .on('data', (row: Record<string, string>) => rows.push(row))
      .on('end', () => resolve())
      .on('error', reject);
  });
  return rows;
}

const worker = new Worker(
  'csv-ingestion',
  async (job) => {
    const { jobId, s3Key, tenantId, agentId } = job.data as {
      jobId: string;
      s3Key: string;
      tenantId: string;
      agentId: string | null;
    };
    try {
      if (!s3Key || !env.AWS_S3_BUCKET) {
        throw new Error('Missing s3Key or AWS_S3_BUCKET');
      }

      const rows = await streamCsvRows(s3Key);
      await CsvUploadJob.update({ total_rows: rows.length }, { where: { id: jobId } });

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        try {
          const { success, failed } = await processBatch(batch, tenantId, agentId);
          await csvService.incrementJobCounts(jobId, success, failed);
        } catch (err: any) {
          logger.error('CSV batch error', { jobId, error: err?.message });
          await csvService.incrementJobCounts(jobId, 0, batch.length);
        }
      }

      await csvService.setJobCompleted(jobId);
    } catch (err: any) {
      logger.error('CSV job failed', {
        jobId,
        error: err?.message,
        stack: err?.stack,
      });
      await csvService.setJobFailed(jobId);
      throw err;
    }
  },
  {
    connection,
    concurrency: 1,
  }
);

worker.on('completed', (job) => logger.info('CSV job completed', { jobId: job.id }));
worker.on('failed', (job, err) =>
  logger.error('CSV job failed', { jobId: job?.id, error: err?.message })
);

export { worker };
