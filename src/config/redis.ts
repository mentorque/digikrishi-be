import { Redis } from 'ioredis';
import { env } from './env.js';

const redis = new Redis({
  host: env.REDIS_HOST,
  port: Number(env.REDIS_PORT),
  maxRetriesPerRequest: null,
  connectTimeout: 10000,
  retryStrategy: (times) => (times <= 3 ? Math.min(times * 500, 2000) : null),
});

redis.on('error', (err: Error) => {
  console.error('Redis connection error:', err);
});

export { redis };
