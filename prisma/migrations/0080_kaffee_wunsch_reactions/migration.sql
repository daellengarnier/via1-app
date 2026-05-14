-- Emoji-Reactions auf Kaffeewuensche (analog zur Pinnwand).

CREATE TABLE "KaffeeWunschReaction" (
  "id"        TEXT NOT NULL,
  "wunschId"  TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "emoji"     TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KaffeeWunschReaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "KaffeeWunschReaction_wunschId_fkey"
    FOREIGN KEY ("wunschId") REFERENCES "KaffeeWunsch"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "KaffeeWunschReaction_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "KaffeeWunschReaction_wunschId_userId_emoji_key"
  ON "KaffeeWunschReaction"("wunschId", "userId", "emoji");
CREATE INDEX "KaffeeWunschReaction_wunschId_idx"
  ON "KaffeeWunschReaction"("wunschId");
