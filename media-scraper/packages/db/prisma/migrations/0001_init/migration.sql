CREATE TYPE "ScrapeStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE "MediaType" AS ENUM ('image', 'video');

CREATE TABLE "ScrapeJob" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "status" "ScrapeStatus" NOT NULL DEFAULT 'pending',
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ScrapeJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Media" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "type" "MediaType" NOT NULL,
  "mediaUrl" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ScrapeJob_createdAt_idx" ON "ScrapeJob"("createdAt");
CREATE INDEX "Media_type_idx" ON "Media"("type");
CREATE INDEX "Media_sourceUrl_idx" ON "Media"("sourceUrl");
CREATE INDEX "Media_mediaUrl_idx" ON "Media"("mediaUrl");
CREATE INDEX "Media_createdAt_idx" ON "Media"("createdAt");

CREATE UNIQUE INDEX "Media_sourceUrl_mediaUrl_type_key" ON "Media"("sourceUrl", "mediaUrl", "type");

ALTER TABLE "Media"
ADD CONSTRAINT "Media_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ScrapeJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
