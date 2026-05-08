# Architecture

## High-Level Overview

The platform is built around asynchronous job execution to protect API latency and system memory.

```text
Web UI -> Fastify API -> BullMQ/Redis -> Worker Pool -> Scraper Engine -> PostgreSQL
```

## Monorepo Design

- `apps/api`: enqueue API + read queries
- `apps/worker`: async scrape processors
- `apps/web`: dashboard
- `packages/db`: Prisma schema/client
- `packages/scraper`: scraping and SSRF-safe URL handling
- `packages/shared`: env schema, queue constants, logger

## Why API and Worker Are Separated

- isolates request handling from scraping latency
- prevents request timeout amplification
- allows independent horizontal scaling
- keeps API memory stable during spike traffic

## Queue-Based Architecture

- API writes `ScrapeJob` rows and enqueues jobs
- workers consume with bounded concurrency
- failed jobs retry with exponential backoff
- Redis absorbs burst traffic (backpressure layer)

## Technology Rationale

- BullMQ: mature Redis-backed queue with retries/delays/concurrency
- Cheerio over Puppeteer: lower memory and CPU footprint, critical for 1 CPU / 1 GB RAM target
- Fastify: lower overhead and better throughput in constrained environments

## Memory + Concurrency Strategy

- worker concurrency capped (default 6)
- no unbounded `Promise.all` job fanout
- chunked `createMany` inserts
- page scrape caps (`MAX_MEDIA_PER_PAGE`)
- small scrape response size and timeout limits

## Docker Topology

```text
compose:
  - postgres
  - redis
  - api
  - worker
  - web
```

Single compose stack for local development and integration testing.

## Failure Handling

- queue retries (`attempts=3`, exponential backoff)
- job status transitions (`pending -> processing -> completed|failed`)
- worker writes explicit failure reason for operations visibility
- health + metrics endpoints for runtime checks

## Tradeoffs

- not using headless browser limits JS-rendered scraping depth
- bounded worker concurrency lowers peak throughput but protects RAM
- strong SSRF checks may reject edge-case internal test targets by design

## Future Improvements

- dead-letter queue and replay tools
- per-domain throttling policies
- OpenTelemetry tracing
- queue partitioning by domain hash
- circuit breakers for repeated domain failures
