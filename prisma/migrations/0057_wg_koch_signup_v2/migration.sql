-- Kochplan-Signup nach neuer Spec:
-- - alte adults/kids-Spalten droppen (User-Entscheid: Daten wegwerfen)
-- - status: "going" | "declined"
-- - childrenIds: Liste der Kinder (aus WgKochKind) die mitkommen
-- - guests bleibt als optionale Gaeste-Counter

-- Bestehende Signups loeschen (sauberer Neustart)
DELETE FROM "WgKochSignup";

-- Spalten anpassen
ALTER TABLE "WgKochSignup" DROP COLUMN "adults";
ALTER TABLE "WgKochSignup" DROP COLUMN "kids";
ALTER TABLE "WgKochSignup" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'going';
ALTER TABLE "WgKochSignup" ADD COLUMN "childrenIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Kinder-Tabelle pro WG
CREATE TABLE "WgKochKind" (
  "id"        TEXT NOT NULL,
  "wgId"      TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "parentIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WgKochKind_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WgKochKind_wgId_idx" ON "WgKochKind"("wgId");

ALTER TABLE "WgKochKind" ADD CONSTRAINT "WgKochKind_wgId_fkey"
  FOREIGN KEY ("wgId") REFERENCES "Wg"("id") ON DELETE CASCADE ON UPDATE CASCADE;
