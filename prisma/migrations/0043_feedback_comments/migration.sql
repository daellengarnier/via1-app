-- Add status column to feedbacks
ALTER TABLE "feedbacks" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'offen';

-- Create feedback comments table
CREATE TABLE IF NOT EXISTS "feedback_comments" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "feedback_comments_feedbackId_idx" ON "feedback_comments"("feedbackId");

ALTER TABLE "feedback_comments" ADD CONSTRAINT "feedback_comments_feedbackId_fkey"
  FOREIGN KEY ("feedbackId") REFERENCES "feedbacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
