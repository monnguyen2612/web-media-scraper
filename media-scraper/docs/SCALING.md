# Scaling

## Handling 5000 Concurrent Submissions

- API performs lightweight validation + enqueue only.
- Redis queue absorbs burst submissions and smooths processing rate.
- Worker throughput is decoupled from request concurrency.

## Backpressure Strategy

- queue length reflects processing pressure
- API still returns quickly (202) while queue buffers work
- worker concurrency bounded to protect CPU and memory

## Why Not Promise.all for Thousands

Unbounded `Promise.all` on scrape tasks causes:
- high memory retention
- event loop stalls
- outbound socket spikes
- cascading failure on small hardware

This implementation uses queue admission + bounded worker concurrency.

## Resource-Constrained Operation (1 CPU / 1 GB)

- no headless browser
- low concurrency (5-10)
- small timeout and response cap
- chunked DB writes
- no full HTML persistence

## Horizontal Scale

- scale worker replicas independently
- keep API replicas stateless
- keep one Redis or move to Redis cluster/sentinel
- partition queue by domain or region at higher scale

## Redis and DB Bottlenecks

- Redis: monitor latency, memory, keyspace hits
- DB: ensure indexed pagination and dedup constraints
- add read replicas and partitioning for long-term growth
