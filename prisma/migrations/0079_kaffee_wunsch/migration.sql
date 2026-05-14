-- Kaffeewuensche: Abo-Mitglieder vermerken Kaffees zum Ausprobieren
-- oder Lieblinge fuer die naechste Bestellung.

CREATE TABLE "KaffeeWunsch" (
  "id"          TEXT NOT NULL,
  "kaffeeName"  TEXT NOT NULL,
  "notes"       TEXT NOT NULL DEFAULT '',
  "shopUrl"     TEXT,
  "kind"        TEXT NOT NULL DEFAULT 'want_to_try',
  "createdById" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KaffeeWunsch_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "KaffeeWunsch_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "KaffeeWunsch_createdAt_idx" ON "KaffeeWunsch"("createdAt");
