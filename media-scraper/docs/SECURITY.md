# Security

## SSRF Protection

- only `http` and `https` protocols allowed
- blocks localhost hostnames
- blocks private/internal literal IP ranges
- resolves DNS and rejects private IP destinations in scraper engine

## Input and Payload Validation

- Zod schema validation for all scrape inputs and query params
- body size limit on Fastify server
- URL array length limits

## Abuse Prevention

- Fastify rate limiting
- bounded worker concurrency
- queue separation from request lifecycle

## Timeout and Resource Limits

- per-request timeout (5s)
- redirect cap (3)
- response size cap and media-per-page cap

## Safe Scraping Practices

- no cookie/session replay
- no internal network access
- no browser automation surface
- deterministic extraction selectors only
