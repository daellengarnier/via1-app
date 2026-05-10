-- WG-Termine: private Sitzungen + Treffen pro WG, mit Traktanden,
-- Protokoll, Kommentaren.
CREATE TABLE "WgTermin" (
  "id"          TEXT NOT NULL,
  "wgId"        TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "date"        TIMESTAMP(3) NOT NULL,
  "endDate"     TIMESTAMP(3),
  "location"    TEXT,
  "description" TEXT,
  "protokoll"   TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WgTermin_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WgTermin_wgId_date_idx" ON "WgTermin"("wgId", "date");

ALTER TABLE "WgTermin" ADD CONSTRAINT "WgTermin_wgId_fkey"
  FOREIGN KEY ("wgId") REFERENCES "Wg"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WgTermin" ADD CONSTRAINT "WgTermin_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WgTerminTraktandum" (
  "id"        TEXT NOT NULL,
  "terminId"  TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "notes"     TEXT,
  "order"     INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WgTerminTraktandum_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WgTerminTraktandum_terminId_idx" ON "WgTerminTraktandum"("terminId");

ALTER TABLE "WgTerminTraktandum" ADD CONSTRAINT "WgTerminTraktandum_terminId_fkey"
  FOREIGN KEY ("terminId") REFERENCES "WgTermin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WgTerminComment" (
  "id"        TEXT NOT NULL,
  "terminId"  TEXT NOT NULL,
  "authorId"  TEXT NOT NULL,
  "text"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WgTerminComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WgTerminComment_terminId_idx" ON "WgTerminComment"("terminId");

ALTER TABLE "WgTerminComment" ADD CONSTRAINT "WgTerminComment_terminId_fkey"
  FOREIGN KEY ("terminId") REFERENCES "WgTermin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WgTerminComment" ADD CONSTRAINT "WgTerminComment_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
