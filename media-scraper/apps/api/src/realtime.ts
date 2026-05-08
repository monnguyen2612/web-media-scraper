import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Redis = require('ioredis') as any;

export type RealtimeEvent =
  | { type: 'JOB_STARTED'; jobId: string }
  | { type: 'JOB_COMPLETED'; jobId: string }
  | { type: 'JOB_FAILED'; jobId: string; error?: string }
  | { type: 'MEDIA_INSERTED'; jobId: string; count: number };

export const realtimeChannel = 'media-scraper:events';

export const createRedisPubSub = (host: string, port: number) => {
  const subscriber = new Redis({ host, port, maxRetriesPerRequest: null });
  return { subscriber };
};

