FROM node:22-alpine

WORKDIR /app

RUN corepack enable

ENV CI=1

COPY . .

RUN pnpm install --frozen-lockfile=false --no-color --ignore-scripts
RUN pnpm --filter @media-scraper/db prisma:generate
RUN pnpm --filter @media-scraper/api build

EXPOSE 3000

CMD ["sh", "-c", "pnpm --filter @media-scraper/db prisma:migrate && pnpm --filter @media-scraper/api dev"]
