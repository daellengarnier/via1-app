-- Aufgabe.completedBy: wer hat die Aufgabe als erledigt markiert.
ALTER TABLE "aufgaben"
  ADD COLUMN "completedById" TEXT;

ALTER TABLE "aufgaben"
  ADD CONSTRAINT "aufgaben_completedById_fkey"
  FOREIGN KEY ("completedById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "aufgaben_completedById_idx"
  ON "aufgaben"("completedById");

-- User.lastVisitedWgId: zuletzt besuchte WG fuer den /meine-wg Auto-Redirect.
ALTER TABLE "users"
  ADD COLUMN "lastVisitedWgId" TEXT;

ALTER TABLE "users"
  ADD CONSTRAINT "users_lastVisitedWgId_fkey"
  FOREIGN KEY ("lastVisitedWgId") REFERENCES "Wg"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
