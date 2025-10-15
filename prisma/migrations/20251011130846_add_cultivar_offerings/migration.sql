-- AlterTable
ALTER TABLE "Cultivar" ADD COLUMN     "breeder" TEXT;

-- CreateTable
CREATE TABLE "CultivarOffering" (
    "id" SERIAL NOT NULL,
    "cultivarId" INTEGER NOT NULL,
    "providerId" INTEGER NOT NULL,
    "priceEur" DECIMAL(65,30) DEFAULT 0.0,
    "category" TEXT,
    "terpenes" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CultivarOffering_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CultivarOffering_providerId_cultivarId_key" ON "CultivarOffering"("providerId", "cultivarId");

-- AddForeignKey
ALTER TABLE "CultivarOffering" ADD CONSTRAINT "CultivarOffering_cultivarId_fkey" FOREIGN KEY ("cultivarId") REFERENCES "Cultivar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CultivarOffering" ADD CONSTRAINT "CultivarOffering_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
