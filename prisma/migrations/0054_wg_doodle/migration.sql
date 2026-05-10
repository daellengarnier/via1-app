-- Termin-Doodle pro WG: Datums-Umfragen die in einen WG-Termin
-- finalisiert werden koennen.
CREATE TABLE "WgDoodle" (
  "id"            TEXT NOT NULL,
  "wgId"          TEXT NOT NULL,
  "title"         TEXT NOT NULL,
  "description"   TEXT,
  "location"      TEXT,
  "duration"      INTEGER,
  "createdById"   TEXT NOT NULL,
  "finalizedAt"   TIMESTAMP(3),
  "finalizedDate" TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WgDoodle_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WgDoodle_wgId_idx" ON "WgDoodle"("wgId");

ALTER TABLE "WgDoodle" ADD CONSTRAINT "WgDoodle_wgId_fkey"
  FOREIGN KEY ("wgId") REFERENCES "Wg"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WgDoodle" ADD CONSTRAINT "WgDoodle_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WgDoodleOption" (
  "id"        TEXT NOT NULL,
  "doodleId"  TEXT NOT NULL,
  "date"      TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WgDoodleOption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WgDoodleOption_doodleId_idx" ON "WgDoodleOption"("doodleId");

ALTER TABLE "WgDoodleOption" ADD CONSTRAINT "WgDoodleOption_doodleId_fkey"
  FOREIGN KEY ("doodleId") REFERENCES "WgDoodle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WgDoodleVote" (
  "id"        TEXT NOT NULL,
  "optionId"  TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WgDoodleVote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WgDoodleVote_optionId_userId_key"
  ON "WgDoodleVote"("optionId", "userId");

ALTER TABLE "WgDoodleVote" ADD CONSTRAINT "WgDoodleVote_optionId_fkey"
  FOREIGN KEY ("optionId") REFERENCES "WgDoodleOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WgDoodleVote" ADD CONSTRAINT "WgDoodleVote_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
