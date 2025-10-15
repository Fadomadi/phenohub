-- DropForeignKey
ALTER TABLE "public"."Interaction" DROP CONSTRAINT "Interaction_reportId_fkey";

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
