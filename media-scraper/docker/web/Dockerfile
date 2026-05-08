FROM node:22-alpine

WORKDIR /app
RUN corepack enable

ENV CI=1

COPY . .
RUN pnpm install --frozen-lockfile=false --no-color --ignore-scripts
RUN pnpm --filter @media-scraper/web build

EXPOSE 5173
CMD ["pnpm", "--filter", "@media-scraper/web", "dev", "--host", "0.0.0.0"]
