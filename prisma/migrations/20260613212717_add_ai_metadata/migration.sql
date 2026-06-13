-- AlterTable
ALTER TABLE "PhotoMetadata" ADD COLUMN     "aiCaption" TEXT,
ADD COLUMN     "aiEnrichedAt" TIMESTAMP(3),
ADD COLUMN     "aiMood" TEXT;
