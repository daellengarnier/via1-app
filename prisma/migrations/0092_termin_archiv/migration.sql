-- Termin-Archiv: archivedAt setzt einen Termin in den Archiv-Tab.
-- Additive Aenderung — bestehende Termine bleiben unangetastet
-- (archivedAt IS NULL = aktiv).

ALTER TABLE "termine" ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE INDEX "termine_archivedAt_idx" ON "termine"("archivedAt");
