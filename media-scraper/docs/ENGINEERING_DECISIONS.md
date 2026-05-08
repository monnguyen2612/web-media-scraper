# Engineering Decisions

## Fastify over Express

- **Benefits**: lower overhead, strong perf, built-in schema ecosystem.
- **Tradeoffs**: smaller ecosystem than Express in some middleware areas.
- **Alternatives**: Express, NestJS.

## BullMQ for Async Processing

- **Benefits**: retries, backoff, delayed jobs, concurrency control.
- **Tradeoffs**: requires Redis operations ownership.
- **Alternatives**: RabbitMQ, SQS, Kafka.

## PostgreSQL + Prisma

- **Benefits**: relational integrity, indexing, strong query capability, typed ORM.
- **Tradeoffs**: migration management discipline required.
- **Alternatives**: MongoDB, raw SQL query builders.

## React + Vite

- **Benefits**: fast local iteration, mature UI ecosystem, flexible architecture.
- **Tradeoffs**: requires explicit architectural boundaries for large apps.
- **Alternatives**: Next.js, Remix.

## Monorepo

- **Benefits**: shared types/utilities, consistent tooling, atomic cross-service changes.
- **Tradeoffs**: CI can become heavier without selective pipelines.
- **Alternatives**: polyrepo split by service.

## Redis for Queue Backend

- **Benefits**: low-latency queue operations, BullMQ compatibility.
- **Tradeoffs**: in-memory operational considerations.
- **Alternatives**: Postgres queue tables, RabbitMQ.

## Queue-Based Design

- **Benefits**: backpressure, resiliency, stable API latency.
- **Tradeoffs**: eventual consistency for scrape completion.
- **Alternatives**: synchronous request scraping (rejected due to scalability risk).

## Worker Separation

- **Benefits**: independent scaling and failure isolation.
- **Tradeoffs**: extra deployment unit complexity.
- **Alternatives**: single-process mixed API/worker runtime.

## Cheerio Scraper

- **Benefits**: minimal resource usage and predictable runtime.
- **Tradeoffs**: cannot execute JS-rendered content.
- **Alternatives**: Puppeteer/Playwright (rejected due to memory constraints).

## react-window Virtualization

- **Benefits**: bounded DOM nodes and smooth scrolling.
- **Tradeoffs**: more complex layout logic.
- **Alternatives**: plain mapped lists/grids.
