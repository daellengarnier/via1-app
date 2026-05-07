-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "feedbacks" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "authorName" TEXT NOT NULL,
    "authorEmail" TEXT NOT NULL,
    "githubIssue" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "feedbacks_createdAt_idx" ON "feedbacks"("createdAt");
