-- Aktivitaeten bekommen ein Publikum: ALL (Standard, wie bisher),
-- WGS (nur Mitglieder der verknuepften WGs) oder USERS (nur die
-- verknuepften Personen). ADDITIV: bestehende Aktivitaeten bleiben
-- fuer alle sichtbar (Default 'ALL').
--
-- Alles idempotent (IF NOT EXISTS / Guard auf pg_constraint), weil
-- prisma/pre-migrate.js dieselben Objekte als Notfall-Massnahme schon
-- vor "migrate deploy" anlegen kann.

ALTER TABLE "activities"
  ADD COLUMN IF NOT EXISTS "audienceType" TEXT NOT NULL DEFAULT 'ALL';

CREATE TABLE IF NOT EXISTS "_ActivityAudienceUsers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ActivityAudienceUsers_AB_pkey" PRIMARY KEY ("A","B")
);
CREATE INDEX IF NOT EXISTS "_ActivityAudienceUsers_B_index"
    ON "_ActivityAudienceUsers"("B");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_ActivityAudienceUsers_A_fkey') THEN
    ALTER TABLE "_ActivityAudienceUsers" ADD CONSTRAINT "_ActivityAudienceUsers_A_fkey"
      FOREIGN KEY ("A") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_ActivityAudienceUsers_B_fkey') THEN
    ALTER TABLE "_ActivityAudienceUsers" ADD CONSTRAINT "_ActivityAudienceUsers_B_fkey"
      FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "_ActivityAudienceWgs" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ActivityAudienceWgs_AB_pkey" PRIMARY KEY ("A","B")
);
CREATE INDEX IF NOT EXISTS "_ActivityAudienceWgs_B_index"
    ON "_ActivityAudienceWgs"("B");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_ActivityAudienceWgs_A_fkey') THEN
    ALTER TABLE "_ActivityAudienceWgs" ADD CONSTRAINT "_ActivityAudienceWgs_A_fkey"
      FOREIGN KEY ("A") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_ActivityAudienceWgs_B_fkey') THEN
    ALTER TABLE "_ActivityAudienceWgs" ADD CONSTRAINT "_ActivityAudienceWgs_B_fkey"
      FOREIGN KEY ("B") REFERENCES "Wg"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
