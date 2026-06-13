-- Enable pgvector for semantic photo search embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "PhotoMetadata" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "embedding" vector(1536),
ADD COLUMN     "embeddingUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "locationGeocodedAt" TIMESTAMP(3),
ADD COLUMN     "locationName" TEXT;

-- CreateIndex
CREATE INDEX "PhotoMetadata_city_idx" ON "PhotoMetadata"("city");

-- CreateIndex
CREATE INDEX "PhotoMetadata_country_idx" ON "PhotoMetadata"("country");
