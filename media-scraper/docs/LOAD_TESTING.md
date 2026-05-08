# Load Testing

## Tooling

- k6 script: `tests/load/scrape.js`
- target endpoint: `POST /scrape`
- objective: stress queue ingestion path, not live scraping throughput

## Strategy

- ramp virtual users to high submission rate
- each iteration submits a URL batch
- validate `202 Accepted` reliability under load

## Run

```bash
k6 run tests/load/scrape.js
```

Environment override:

```bash
API_BASE_URL=http://localhost:3000 k6 run tests/load/scrape.js
```

## Metrics to Observe

- request failure rate
- p95 enqueue latency
- queue waiting depth trend
- API CPU/memory under sustained load

## Expected Behavior

- API remains responsive (fast 202 responses)
- queue depth grows under pressure, then drains
- worker throughput remains bounded and stable

## Bottleneck Analysis

- if API latency spikes: inspect Redis or DB write path
- if queue drains slowly: add worker replicas
- if failures rise: inspect SSRF rejects/timeouts/retry saturation
