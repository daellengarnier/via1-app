-- User: per-feature push-pref fuer "Meine WG"-Bereich
ALTER TABLE "users" ADD COLUMN "notifyMeineWg" BOOLEAN NOT NULL DEFAULT true;

-- Kochplan-Vorlagen pro WG
CREATE TABLE "WgKochTemplate" (
  "id"          TEXT NOT NULL,
  "wgId"        TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "defaultTime" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WgKochTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WgKochTemplate_wgId_idx" ON "WgKochTemplate"("wgId");

ALTER TABLE "WgKochTemplate" ADD CONSTRAINT "WgKochTemplate_wgId_fkey"
  FOREIGN KEY ("wgId") REFERENCES "Wg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Kochplan-Eintraege (ein Essen an einem Tag)
CREATE TABLE "WgKochEintrag" (
  "id"          TEXT NOT NULL,
  "wgId"        TEXT NOT NULL,
  "date"        DATE NOT NULL,
  "time"        TEXT,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "cookId"      TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WgKochEintrag_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WgKochEintrag_wgId_date_idx" ON "WgKochEintrag"("wgId", "date");

ALTER TABLE "WgKochEintrag" ADD CONSTRAINT "WgKochEintrag_wgId_fkey"
  FOREIGN KEY ("wgId") REFERENCES "Wg"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WgKochEintrag" ADD CONSTRAINT "WgKochEintrag_cookId_fkey"
  FOREIGN KEY ("cookId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WgKochEintrag" ADD CONSTRAINT "WgKochEintrag_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Anmeldungen (wer isst mit, mit Erwachsenen/Kindern/Gaesten-Count)
CREATE TABLE "WgKochSignup" (
  "id"        TEXT NOT NULL,
  "eintragId" TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "adults"    INTEGER NOT NULL DEFAULT 1,
  "kids"      INTEGER NOT NULL DEFAULT 0,
  "guests"    INTEGER NOT NULL DEFAULT 0,
  "notes"     TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WgKochSignup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WgKochSignup_eintragId_userId_key"
  ON "WgKochSignup"("eintragId", "userId");

ALTER TABLE "WgKochSignup" ADD CONSTRAINT "WgKochSignup_eintragId_fkey"
  FOREIGN KEY ("eintragId") REFERENCES "WgKochEintrag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WgKochSignup" ADD CONSTRAINT "WgKochSignup_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
