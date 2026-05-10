import pino from 'pino';
import { z } from 'zod';

export const scrapeQueueName = 'scrape-queue';

export const appEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgresql://postgres:postgres@localhost:5432/media_scraper?schema=public'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  API_PORT: z.coerce.number().default(3000),
  WORKER_CONCURRENCY: z.coerce.number().min(1).max(10).default(6),
  RATE_LIMIT_MAX: z.coerce.number().min(1).default(1000)
});

export type AppEnv = z.infer<typeof appEnvSchema>;

export const parseEnv = (input: Record<string, unknown>): AppEnv => appEnvSchema.parse(input);

export const createLogger = (name: string) =>
  pino({
    name,
    level: process.env.LOG_LEVEL ?? 'info',
    redact: ['req.headers.authorization']
  });

export const createRedisConnection = (host: string, port: number) => ({
  host,
  port,
  maxRetriesPerRequest: null as null
});

export const scrapeRequestSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(5000)
});

export type ScrapeRequest = z.infer<typeof scrapeRequestSchema>;

export const mediaQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(24),
  type: z.enum(['image', 'video']).optional(),
  search: z.string().trim().max(255).optional()
});

export type MediaQuery = z.infer<typeof mediaQuerySchema>;
