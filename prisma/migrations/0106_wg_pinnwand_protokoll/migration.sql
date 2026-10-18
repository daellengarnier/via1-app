-- Erweitert WgPinnwandNote um optionalen Link, Ablaufdatum und Verknuepfung
-- zu WgTermin, damit das automatisch gepinnte Sitzungsprotokoll als eigener
-- Post gefuehrt werden kann (idempotent anhand wgTerminId).
ALTER TABLE "WgPinnwandNote" ADD COLUMN IF NOT EXISTS "linkUrl" TEXT;
ALTER TABLE "WgPinnwandNote" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "WgPinnwandNote" ADD COLUMN IF NOT EXISTS "wgTerminId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "WgPinnwandNote_wgTerminId_key"
  ON "WgPinnwandNote"("wgTerminId");
CREATE INDEX IF NOT EXISTS "WgPinnwandNote_expiresAt_idx"
  ON "WgPinnwandNote"("expiresAt");
