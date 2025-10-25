-- AlterTable
ALTER TABLE "Cultivar" ADD COLUMN     "aromaProfile" TEXT,
ADD COLUMN     "effectProfile" TEXT,
ADD COLUMN     "flavorProfile" TEXT,
ADD COLUMN     "floweringTime" TEXT,
ADD COLUMN     "yieldPotential" TEXT;

-- AlterTable
ALTER TABLE "HighlightFeedback" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "archivedAt" SET DATA TYPE TIMESTAMP(3);
