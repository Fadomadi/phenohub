-- CreateTable
CREATE TABLE "HighlightFeedback" (
    "id" SERIAL PRIMARY KEY,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "authorName" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "idx_highlight_feedback_created_at" ON "HighlightFeedback"("createdAt");
CREATE INDEX "idx_highlight_feedback_user" ON "HighlightFeedback"("userId");

-- AddForeignKey
ALTER TABLE "HighlightFeedback"
ADD CONSTRAINT "HighlightFeedback_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
