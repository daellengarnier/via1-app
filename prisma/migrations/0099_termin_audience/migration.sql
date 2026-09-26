-- Termine bekommen dasselbe Publikum wie Aktivitaeten (0098):
-- ALL (Standard, wie bisher), WGS oder USERS. ADDITIV: bestehende
-- Termine bleiben fuer alle sichtbar.
--
-- Alles idempotent (IF NOT EXISTS / Guard auf pg_constraint), weil
-- prisma/pre-migrate.js dieselben Objekte als Notfall-Massnahme schon
-- vor "migrate deploy" anlegen kann.

ALTER TABLE "termine"
  ADD COLUMN IF NOT EXISTS "audienceType" TEXT NOT NULL DEFAULT 'ALL';

CREATE TABLE IF NOT EXISTS "_TerminAudienceUsers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TerminAudienceUsers_AB_pkey" PRIMARY KEY ("A","B")
);
CREATE INDEX IF NOT EXISTS "_TerminAudienceUsers_B_index"
    ON "_TerminAudienceUsers"("B");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_TerminAudienceUsers_A_fkey') THEN
    ALTER TABLE "_TerminAudienceUsers" ADD CONSTRAINT "_TerminAudienceUsers_A_fkey"
      FOREIGN KEY ("A") REFERENCES "termine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_TerminAudienceUsers_B_fkey') THEN
    ALTER TABLE "_TerminAudienceUsers" ADD CONSTRAINT "_TerminAudienceUsers_B_fkey"
      FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "_TerminAudienceWgs" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TerminAudienceWgs_AB_pkey" PRIMARY KEY ("A","B")
);
CREATE INDEX IF NOT EXISTS "_TerminAudienceWgs_B_index"
    ON "_TerminAudienceWgs"("B");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_TerminAudienceWgs_A_fkey') THEN
    ALTER TABLE "_TerminAudienceWgs" ADD CONSTRAINT "_TerminAudienceWgs_A_fkey"
      FOREIGN KEY ("A") REFERENCES "termine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_TerminAudienceWgs_B_fkey') THEN
    ALTER TABLE "_TerminAudienceWgs" ADD CONSTRAINT "_TerminAudienceWgs_B_fkey"
      FOREIGN KEY ("B") REFERENCES "Wg"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
