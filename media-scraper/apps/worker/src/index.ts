import { prisma } from '@media-scraper/db';
import { scrapeMediaFromPage } from '@media-scraper/scraper';
import { createLogger, createRedisConnection, parseEnv, scrapeQueueName } from '@media-scraper/shared';
import { QueueEvents, Worker } from 'bullmq';
import { createPublisher, realtimeChannel, type RealtimeEvent } from './realtime.js';

const env = parseEnv(process.env);
const logger = createLogger('worker');
const redisConnection = createRedisConnection(env.REDIS_HOST, env.REDIS_PORT);
const publisher = createPublisher(env.REDIS_HOST, env.REDIS_PORT);

const queueEvents = new QueueEvents(scrapeQueueName, { connection: redisConnection });
await queueEvents.waitUntilReady();

const publish = async (evt: RealtimeEvent): Promise<void> => {
  await publisher.publish(realtimeChannel, JSON.stringify(evt));
};

const worker = new Worker<{ scrapeJobId: string; url: string }>(
  scrapeQueueName,
  async (job) => {
    const { scrapeJobId, url } = job.data;
    await prisma.scrapeJob.update({ where: { id: scrapeJobId }, data: { status: 'processing', error: null } });
    await publish({ type: 'JOB_STARTED', jobId: scrapeJobId });

    try {
      const scraped = await scrapeMediaFromPage(url);
      const batchSize = 100;
      for (let i = 0; i < scraped.length; i += batchSize) {
        const chunk = scraped.slice(i, i + batchSize);
        await prisma.media.createMany({
          data: chunk.map((item) => ({
            jobId: scrapeJobId,
            type: item.type,
            mediaUrl: item.mediaUrl,
            sourceUrl: item.sourceUrl
          })),
          skipDuplicates: true
        });
      }

      if (scraped.length > 0) {
        await publish({ type: 'MEDIA_INSERTED', jobId: scrapeJobId, count: scraped.length });
      }

      await prisma.scrapeJob.update({
        where: { id: scrapeJobId },
        data: { status: 'completed' }
      });
      await publish({ type: 'JOB_COMPLETED', jobId: scrapeJobId });
      logger.info({ scrapeJobId, count: scraped.length }, 'Scrape completed');
      return { mediaCount: scraped.length };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown scrape error';
      await prisma.scrapeJob.update({
        where: { id: scrapeJobId },
        data: { status: 'failed', error: errorMessage }
      });
      await publish({ type: 'JOB_FAILED', jobId: scrapeJobId, error: errorMessage });
      logger.error({ scrapeJobId, err: error }, 'Scrape failed');
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: env.WORKER_CONCURRENCY
  }
);

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Queue job failed');
});

const close = async (): Promise<void> => {
  await worker.close();
  await queueEvents.close();
  await publisher.quit();
  await prisma.$disconnect();
};

process.on('SIGINT', async () => close());
process.on('SIGTERM', async () => close());
