# Scraping Engine

## Flow

1. Validate URL protocol and resolve DNS.
2. Block private/internal targets (SSRF protection).
3. Fetch HTML with timeout and redirect limits.
4. Parse with Cheerio.
5. Extract and normalize candidate URLs.
6. Deduplicate and return typed media set.

## Extraction Rules

- `img[src]`
- `img[data-src]`
- `img[data-lazy-src]`
- `video[src]`
- `source[src]`
- `meta[property="og:image"]`

## URL Normalization

All relative URLs are converted using:

`new URL(relative, pageUrl).href`

Invalid protocols, malformed URLs, and `data:` URLs are dropped.

## Retry + Timeout

- request timeout: 5 seconds
- max redirects: 3
- retries: 2 additional attempts with exponential delay

## Memory Safety

- strict max media per page cap
- no HTML persistence to DB
- no headless browser runtime
- per-job isolated in worker lifecycle

## Why Cheerio Instead of Puppeteer

- much lower CPU and RAM overhead
- faster cold-start and container startup
- suitable for static HTML scraping use case
