-- AlterTable
ALTER TABLE "HighlightFeedback"
ADD COLUMN "archivedAt" TIMESTAMPTZ;

-- CreateIndex
CREATE INDEX "idx_highlight_feedback_archived_at" ON "HighlightFeedback"("archivedAt");
