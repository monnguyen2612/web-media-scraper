# Deployment

## Docker Architecture

- each runtime has dedicated image: `api`, `worker`, `web`
- dependencies: PostgreSQL and Redis
- `docker compose up --build` runs full stack

## Compose Services

- `postgres` persistent volume
- `redis` queue backend
- `api` enqueue + read APIs
- `worker` scrape processor
- `web` dashboard

## Local Deployment

1. copy `.env.example` to `.env`
2. `docker compose up --build`
3. open web and API docs endpoints

## Cloud Deployment Strategy

### Vercel (Frontend)
- deploy `apps/web` as static/Vite site
- set `VITE_API_BASE_URL` to public API URL

### Railway (API/Worker/Data)
- run API + worker as separate services
- managed Redis + PostgreSQL
- auto restart and environment variable management

## CI/CD Suggestions

- lint/build/test gates for all workspace packages
- run Prisma generate in build pipeline
- smoke tests for `/health` and `/metrics`

## Monitoring Suggestions

- queue depth, active jobs, failure rate
- API p95 latency and rate limit trigger counts
- worker success/failure ratio
- DB connection and slow query metrics
