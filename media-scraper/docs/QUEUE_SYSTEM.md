# Queue System

## BullMQ Architecture

- API uses BullMQ `Queue` to enqueue scrape jobs.
- Worker uses BullMQ `Worker` with bounded concurrency.
- Redis stores queue state and retries.

## Job Lifecycle

```text
pending -> processing -> completed
                        -> failed
```

## Retry and Backoff

- each job has `attempts=3`
- exponential backoff starts at 500ms
- failed jobs store error details in SQL for visibility

## Concurrency Management

- worker concurrency bounded to `1..10` (default 6)
- independent from HTTP request volume
- protects system from thundering-herd workloads

## Dead Letter Concept

Current implementation persists failures in `ScrapeJob.error`.
Future enhancement: dedicated dead-letter queue and replay endpoint.

## Why Queueing Is Critical

Queueing turns immediate concurrent demand into controllable sequential work, preventing memory spikes and preserving system responsiveness under heavy load.
