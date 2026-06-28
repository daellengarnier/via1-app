-- Aufgaben-Veroeffentlichung (publishedAt): Pendenzen aus der Sitzung
-- sind "Drafts" bis das Protokoll abgeschlossen wird. Alle bestehenden
-- Aufgaben werden auf createdAt gesetzt, damit sie sofort sichtbar
-- bleiben.

ALTER TABLE "aufgaben" ADD COLUMN "publishedAt" TIMESTAMP(3);

-- Backfill: alle bestehenden Aufgaben publizieren
UPDATE "aufgaben" SET "publishedAt" = "createdAt" WHERE "publishedAt" IS NULL;

CREATE INDEX "aufgaben_publishedAt_idx" ON "aufgaben"("publishedAt");
