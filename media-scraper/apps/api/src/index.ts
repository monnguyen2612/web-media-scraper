import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { prisma } from '@media-scraper/db';
import {
  createLogger,
  createRedisConnection,
  mediaQuerySchema,
  parseEnv,
  scrapeQueueName,
  scrapeRequestSchema
} from '@media-scraper/shared';
import { Queue } from 'bullmq';
import Fastify, { type FastifyInstance } from 'fastify';
import ipaddr from 'ipaddr.js';
import { z } from 'zod';
import { createRedisPubSub, realtimeChannel, type RealtimeEvent } from './realtime.js';

const env = parseEnv(process.env);
const logger = createLogger('api');
const redisConnection = createRedisConnection(env.REDIS_HOST, env.REDIS_PORT);
const queue = new Queue<{ scrapeJobId: string; url: string }>(scrapeQueueName, {
  connection: redisConnection
});

export const buildApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({
    loggerInstance: logger,
    bodyLimit: 256 * 1024
  });

  await app.register(cors, { origin: true });
  await app.register(rateLimit, { max: env.RATE_LIMIT_MAX, timeWindow: '1 minute' });
  await app.register(swagger, {
    openapi: { info: { title: 'Media Scraper API', version: '1.0.0' } }
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  app.get('/health', async () => ({ status: 'ok', queue: scrapeQueueName }));
  app.get('/metrics', async () => {
    const [waiting, active] = await Promise.all([queue.getWaitingCount(), queue.getActiveCount()]);
    return { waiting, active };
  });

  // SSE gateway: Worker -> Redis Pub/Sub -> API -> Clients
  const { subscriber } = createRedisPubSub(env.REDIS_HOST, env.REDIS_PORT);
  await subscriber.subscribe(realtimeChannel);

  type Client = {
    write: (payload: string) => void;
    close: () => void;
    jobIdFilter?: string;
  };
  const clients = new Set<Client>();
  let eventSeq = 0;

  const formatSse = (evt: RealtimeEvent) => {
    eventSeq += 1;
    const id = String(eventSeq);
    const eventName = evt.type;
    const data = JSON.stringify(evt);
    return `id: ${id}\nevent: ${eventName}\ndata: ${data}\n\n`;
  };

  subscriber.on('message', (_channel: string, message: string) => {
    let parsed: RealtimeEvent | null = null;
    try {
      parsed = JSON.parse(message) as RealtimeEvent;
    } catch {
      return;
    }
    const payload = formatSse(parsed);
    for (const c of clients) {
      if (c.jobIdFilter && 'jobId' in parsed && parsed.jobId !== c.jobIdFilter) continue;
      c.write(payload);
    }
  });

  const registerSse = (reply: any, jobIdFilter?: string) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      // CORS for EventSource (we use raw.writeHead, so Fastify CORS hook won't apply)
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no'
    });
    reply.raw.write(`: connected\n\n`);

    const heartbeat = setInterval(() => {
      try {
        reply.raw.write(`: ping\n\n`);
      } catch {
        // ignore; close handler will cleanup
      }
    }, 25000);

    const client: Client = {
      jobIdFilter,
      write: (payload) => {
        reply.raw.write(payload);
      },
      close: () => {
        clearInterval(heartbeat);
        clients.delete(client);
      }
    };

    clients.add(client);
    reply.raw.on('close', () => client.close());
  };

  app.get('/events', async (_request, reply) => {
    registerSse(reply);
    return reply;
  });

  app.get('/events/jobs/:id', async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    registerSse(reply, params.id);
    return reply;
  });

  app.post('/scrape', async (request, reply) => {
  const body = scrapeRequestSchema.parse(request.body);
  const uniqueUrls = [...new Set(body.urls.map((item) => item.trim()))].filter((rawUrl) => {
    try {
      const parsed = new URL(rawUrl);
      const host = parsed.hostname.toLowerCase();
      if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false;
      if (ipaddr.isValid(host)) {
        const ip = ipaddr.parse(host);
        const range =
          ip.kind() === 'ipv4' ? (ip as ipaddr.IPv4).range() : (ip as ipaddr.IPv6).range();
        if (
          ['private', 'loopback', 'linkLocal', 'carrierGradeNat', 'uniqueLocal', 'unspecified'].includes(
            range
          )
        ) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  });

  const created: Array<{ id: string; url: string }> = [];
  const batchSize = 500;
  for (let i = 0; i < uniqueUrls.length; i += batchSize) {
    const chunk = uniqueUrls.slice(i, i + batchSize);
    
    const records = await prisma.scrapeJob.createManyAndReturn({
      data: chunk.map((url) => ({ url, status: 'pending' })),
      select: { id: true, url: true }
    });
    
    created.push(...records);

    await queue.addBulk(
      records.map((record) => ({
        name: 'scrape-url',
        data: { scrapeJobId: record.id, url: record.url },
        opts: {
          attempts: 3,
          removeOnComplete: { age: 3600, count: 10000 },
          removeOnFail: { age: 24 * 3600, count: 10000 },
          backoff: { type: 'exponential', delay: 500 }
        }
      }))
    );
  }

    return reply.code(202).send({ accepted: created.length, jobIds: created.map((item) => item.id) });
  });

  app.get('/jobs/:id', async (request, reply) => {
  const params = z.object({ id: z.string().min(1) }).parse(request.params);
  const job = await prisma.scrapeJob.findUnique({
    where: { id: params.id },
    include: { media: { take: 20, orderBy: { createdAt: 'desc' } } }
  });
  if (!job) return reply.code(404).send({ message: 'Job not found' });
  return job;
  });

  app.get('/jobs', async (request) => {
    const query = z
      .object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(25),
        status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
        search: z.string().trim().max(255).optional()
      })
      .parse(request.query);

    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { url: { contains: query.search, mode: 'insensitive' as const } } : {})
    };

    const skip = (query.page - 1) * query.limit;
    const [total, items] = await prisma.$transaction([
      prisma.scrapeJob.count({ where }),
      prisma.scrapeJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit
      })
    ]);

    return {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
      items
    };
  });

  app.post('/jobs/:id/retry', async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);

    const job = await prisma.scrapeJob.findUnique({
      where: { id: params.id },
      select: { id: true, url: true, status: true }
    });
    if (!job) return reply.code(404).send({ message: 'Job not found' });

    await prisma.scrapeJob.update({
      where: { id: job.id },
      data: { status: 'pending', error: null }
    });

    await queue.add(
      'scrape-url',
      { scrapeJobId: job.id, url: job.url },
      {
        attempts: 3,
        removeOnComplete: { age: 3600, count: 10000 },
        removeOnFail: { age: 24 * 3600, count: 10000 },
        backoff: { type: 'exponential', delay: 500 }
      }
    );

    return reply.code(202).send({ accepted: 1, jobId: job.id });
  });

  app.get('/media', async (request) => {
  const query = mediaQuerySchema.parse(request.query);
  const where = {
    ...(query.type ? { type: query.type } : {}),
    ...(query.search
      ? {
          OR: [
            { mediaUrl: { contains: query.search, mode: 'insensitive' as const } },
            { sourceUrl: { contains: query.search, mode: 'insensitive' as const } }
          ]
        }
      : {})
  };

  const skip = (query.page - 1) * query.limit;
  const [total, items] = await prisma.$transaction([
    prisma.media.count({ where }),
    prisma.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit
    })
  ]);

    return {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
      items
    };
  });

  // Cast at the boundary to avoid overly-strict Fastify generic mismatches
  // when using a custom pino logger instance.
  return app as unknown as FastifyInstance;
};

if (process.env.NODE_ENV !== 'test') {
  const app = await buildApp();
  const close = async (): Promise<void> => {
    await app.close();
    await queue.close();
    await prisma.$disconnect();
  };
  process.on('SIGINT', async () => close());
  process.on('SIGTERM', async () => close());
  app.listen({ port: env.API_PORT, host: '0.0.0.0' }).catch(async (error) => {
    app.log.error(error);
    await close();
    process.exit(1);
  });
}
