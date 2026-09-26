-- Cache-Stempel fuers Profilbild. Listen-Endpoints selektieren nur noch
-- diese Spalte statt der Base64-Spalte "avatar" (bis 700 KB pro User),
-- das Bild selbst kommt ueber /api/users/[id]/avatar?v=<stempel>.
-- Additiv, kein Datenverlust.

-- IF NOT EXISTS, weil prisma/pre-migrate.js die Spalte als Notfall-
-- Massnahme schon vor "migrate deploy" anlegen kann (siehe dort).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatarUpdatedAt" TIMESTAMP(3);

-- Backfill: wer schon ein Bild hat, bekommt den bisherigen updatedAt
-- als Stempel (fuer die Cache-URL reicht irgendein stabiler Wert).
UPDATE "users"
   SET "avatarUpdatedAt" = "updatedAt"
 WHERE "avatar" IS NOT NULL
   AND "avatarUpdatedAt" IS NULL;
