-- Termine bekommen dasselbe Publikum wie Aktivitaeten (0098):
-- ALL (Standard, wie bisher), WGS oder USERS. ADDITIV: bestehende
-- Termine bleiben fuer alle sichtbar.

ALTER TABLE "termine"
  ADD COLUMN IF NOT EXISTS "audienceType" TEXT NOT NULL DEFAULT 'ALL';

CREATE TABLE IF NOT EXISTS "_TerminAudienceUsers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TerminAudienceUsers_AB_pkey" PRIMARY KEY ("A","B")
);
CREATE INDEX IF NOT EXISTS "_TerminAudienceUsers_B_index"
    ON "_TerminAudienceUsers"("B");
ALTER TABLE "_TerminAudienceUsers"
    ADD CONSTRAINT "_TerminAudienceUsers_A_fkey"
    FOREIGN KEY ("A") REFERENCES "termine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_TerminAudienceUsers"
    ADD CONSTRAINT "_TerminAudienceUsers_B_fkey"
    FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "_TerminAudienceWgs" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TerminAudienceWgs_AB_pkey" PRIMARY KEY ("A","B")
);
CREATE INDEX IF NOT EXISTS "_TerminAudienceWgs_B_index"
    ON "_TerminAudienceWgs"("B");
ALTER TABLE "_TerminAudienceWgs"
    ADD CONSTRAINT "_TerminAudienceWgs_A_fkey"
    FOREIGN KEY ("A") REFERENCES "termine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_TerminAudienceWgs"
    ADD CONSTRAINT "_TerminAudienceWgs_B_fkey"
    FOREIGN KEY ("B") REFERENCES "Wg"("id") ON DELETE CASCADE ON UPDATE CASCADE;
