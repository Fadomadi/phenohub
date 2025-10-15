-- DropForeignKey
ALTER TABLE "public"."Report" DROP CONSTRAINT "Report_providerId_fkey";

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
