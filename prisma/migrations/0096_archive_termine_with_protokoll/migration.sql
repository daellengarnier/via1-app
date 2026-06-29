-- Backfill: alle Termine die schon ein Sitzungsprotokoll im
-- Hausbuch haben, gehoeren ins Archiv. Bisher wurde das Archivieren
-- vom Frontend separat angestossen — wenn der User keine
-- canEditTermin-Permission hatte, kam ein stilles 403 und der Termin
-- blieb in der aktiven Liste.

UPDATE "termine" t
   SET "archivedAt" = COALESCE(t."archivedAt", NOW())
 WHERE EXISTS (
   SELECT 1 FROM "sitzungsprotokolle" s
    WHERE s."terminId" = t."id"
 )
   AND t."archivedAt" IS NULL;
