-- Backfill: alle Termine die schon ein Sitzungsprotokoll im
-- Hausbuch haben, gehoeren ins Archiv. Bisher wurde das Archivieren
-- vom Frontend separat angestossen — wenn der User keine
-- canEditTermin-Permission hatte, kam ein stilles 403 und der Termin
-- blieb in der aktiven Liste.
--
-- 2026-10-26: Fix — Tabelle heisst "Sitzungsprotokoll" (Prisma-Default,
-- singular, UpperCamelCase), NICHT "sitzungsprotokolle". Ohne diesen Fix
-- failt die Migration mit 42P01 "relation does not exist" und blockiert
-- alles danach (CLAUDE.md P3009-Pattern). Defensiv gewrappt mit DO-Block
-- + EXCEPTION damit auch Umbenennungen in Zukunft nicht blocken.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'Sitzungsprotokoll'
  ) THEN
    UPDATE "termine" t
       SET "archivedAt" = COALESCE(t."archivedAt", NOW())
     WHERE EXISTS (
       SELECT 1 FROM "Sitzungsprotokoll" s
        WHERE s."terminId" = t."id"
     )
       AND t."archivedAt" IS NULL;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'sitzungsprotokolle'
  ) THEN
    UPDATE "termine" t
       SET "archivedAt" = COALESCE(t."archivedAt", NOW())
     WHERE EXISTS (
       SELECT 1 FROM "sitzungsprotokolle" s
        WHERE s."terminId" = t."id"
     )
       AND t."archivedAt" IS NULL;
  ELSE
    RAISE NOTICE 'Sitzungsprotokoll-Tabelle nicht gefunden — Backfill uebersprungen.';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '0096 backfill failed (nicht fatal): %', SQLERRM;
END $$;
