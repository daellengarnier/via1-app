-- Emoji-Reactions auf Pinnwand-Posts (Hauschat + WG-spezifisch).
-- Pro User + Note + Emoji ein Eintrag (toggle).

CREATE TABLE "PinnwandReaction" (
  "id"        TEXT NOT NULL,
  "noteId"    TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "emoji"     TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PinnwandReaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PinnwandReaction_noteId_fkey"
    FOREIGN KEY ("noteId") REFERENCES "pinnwand_notes"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PinnwandReaction_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PinnwandReaction_noteId_userId_emoji_key"
  ON "PinnwandReaction"("noteId", "userId", "emoji");
CREATE INDEX "PinnwandReaction_noteId_idx"
  ON "PinnwandReaction"("noteId");

CREATE TABLE "WgPinnwandReaction" (
  "id"        TEXT NOT NULL,
  "noteId"    TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "emoji"     TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WgPinnwandReaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WgPinnwandReaction_noteId_fkey"
    FOREIGN KEY ("noteId") REFERENCES "WgPinnwandNote"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WgPinnwandReaction_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "WgPinnwandReaction_noteId_userId_emoji_key"
  ON "WgPinnwandReaction"("noteId", "userId", "emoji");
CREATE INDEX "WgPinnwandReaction_noteId_idx"
  ON "WgPinnwandReaction"("noteId");
