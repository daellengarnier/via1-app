-- CreateTable
CREATE TABLE "game_scores" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "game_scores_score_idx" ON "game_scores"("score" DESC);

-- CreateIndex
CREATE INDEX "game_scores_userId_idx" ON "game_scores"("userId");

-- AddForeignKey
ALTER TABLE "game_scores" ADD CONSTRAINT "game_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Bestehenden gameHighScore in Tabelle uebertragen (einmalig)
INSERT INTO "game_scores" ("id", "userId", "score", "createdAt")
SELECT
  'legacy-' || "id",
  "id",
  "gameHighScore",
  "updatedAt"
FROM "users"
WHERE "gameHighScore" > 0;
