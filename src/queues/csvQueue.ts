import { Queue } from 'bullmq';
import { env } from '../config/env.js';

const connection = {
  host: env.REDIS_HOST,
  port: Number(env.REDIS_PORT),
};

export const csvQueue = new Queue('csv-ingestion', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
});
