# Realtime Architecture (SSE + Redis Pub/Sub)

## Why SSE (and why we avoid polling)

This platform’s realtime requirements are predominantly **server → client** notifications:

- job started / completed / failed
- media inserted for a job

Polling (interval-based refetching) creates:

- unnecessary API traffic
- repeated DB reads
- UI churn from constant cache invalidations
- risk of “polling storms” with many clients

**Server-Sent Events (SSE)** is a better fit:

- HTTP-native, simple operational model
- one long-lived connection per client
- automatic reconnect behavior
- lower memory/CPU than WebSockets for one-way updates
- excellent for dashboards and job status streams

## High-level flow

```text
Worker
  ↓ publish (Redis Pub/Sub)
Redis Channel: media-scraper:events
  ↓ subscribe + broadcast
Fastify SSE Gateway (/events, /events/jobs/:id)
  ↓ EventSource
React Client
  ↓
TanStack Query cache patch / targeted invalidation
```

## Event design (minimal payloads)

Events are small “delta” messages, never full dataset snapshots.

Examples:

```json
{ "type": "JOB_STARTED", "jobId": "abc" }
{ "type": "JOB_COMPLETED", "jobId": "abc" }
{ "type": "JOB_FAILED", "jobId": "abc", "error": "timeout" }
{ "type": "MEDIA_INSERTED", "jobId": "abc", "count": 20 }
```

## Redis Pub/Sub

- Worker publishes JSON events to `media-scraper:events`
- API subscribes once and fans out to connected SSE clients
- Pub/Sub avoids DB reads for “what changed”

## SSE endpoints

- `GET /events`: stream all events
- `GET /events/jobs/:id`: stream only events for a single job

SSE headers:

- `Content-Type: text/event-stream`
- `Cache-Control: no-cache`
- `Connection: keep-alive`

Heartbeat:

Every ~25s the server sends:

```text
: ping
```

This helps keep intermediaries from closing idle connections.

## Client synchronization strategy (TanStack Query)

Principles:

- **Patch cache directly** for job state changes (no refetch)
- **Invalidate only targeted queries** when server-derived lists can’t be safely patched (e.g. paginated media gallery)

Implementation:

- On `JOB_*` events:
  - `queryClient.setQueriesData(['jobs', ...])` updates only the affected job in all cached pages
  - `queryClient.setQueryData(['job', jobId])` updates the job detail cache if present
- On `MEDIA_INSERTED`:
  - invalidate `['job', jobId]` (active only) to refresh “latest media” for that job
  - invalidate active `['media', ...]` queries (active only) because media is paginated and filterable

This keeps traffic low and prevents global refetch loops.

## Comparison vs WebSockets

WebSockets are powerful but add:

- connection/session state complexity
- additional infrastructure concerns (proxies, timeouts, sticky sessions)

SSE is enough for this dashboard’s one-way realtime updates with a simpler footprint.

## Comparison vs long polling

Long polling still:

- repeatedly opens/closes HTTP requests
- causes periodic DB/API load
- scales poorly with many clients

SSE keeps a single connection and pushes only meaningful changes.

## Scaling and low-resource considerations (1 CPU / 1GB RAM)

- Pub/Sub avoids DB reads per refresh interval
- SSE fanout is simple string writes; minimal per-client memory
- Heartbeats are tiny comment frames
- Cache patching reduces UI rerender work and avoids full-list reloads

