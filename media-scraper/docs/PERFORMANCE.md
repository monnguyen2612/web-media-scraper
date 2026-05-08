# Performance

## Low-RAM Strategy

- avoid heavyweight browser engines
- process jobs in bounded concurrency
- cap parse output and avoid retaining large data sets
- store only normalized media URLs

## CPU and Event Loop

- short async operations in API request path
- long-running I/O moved to worker
- no unbounded promise fanout

## Database Efficiency

- batched inserts with `createMany`
- dedup handled by DB unique constraint + skip duplicates
- indexed read paths for filter/search/pagination

## Frontend Performance

- query caching with TanStack Query
- virtualized media rendering via `react-window`
- pagination to keep per-page render set bounded

## Tuning Guidance

- start `WORKER_CONCURRENCY=4..6` on 1 CPU systems
- monitor queue wait time and DB write latency
- increase worker replicas before increasing per-worker concurrency
