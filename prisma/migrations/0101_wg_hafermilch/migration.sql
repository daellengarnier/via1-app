-- Oatly-Hafermilch-Kasse pro WG: Einstellungen (wer trinkt mit, Preis),
-- Bestellungen, Zahlungen. Additiv, idempotent (siehe pre-migrate.js).

CREATE TABLE IF NOT EXISTS "WgHafermilchSettings" (
    "id"             TEXT NOT NULL,
    "wgId"           TEXT NOT NULL,
    "participantIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "unitCents"      INTEGER NOT NULL DEFAULT 2490,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WgHafermilchSettings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "WgHafermilchSettings_wgId_key"
    ON "WgHafermilchSettings"("wgId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WgHafermilchSettings_wgId_fkey') THEN
    ALTER TABLE "WgHafermilchSettings" ADD CONSTRAINT "WgHafermilchSettings_wgId_fkey"
      FOREIGN KEY ("wgId") REFERENCES "Wg"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "WgHafermilchOrder" (
    "id"             TEXT NOT NULL,
    "wgId"           TEXT NOT NULL,
    "boughtById"     TEXT NOT NULL,
    "date"           DATE NOT NULL,
    "quantity"       INTEGER NOT NULL,
    "unitCents"      INTEGER NOT NULL,
    "participantIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdById"    TEXT NOT NULL,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WgHafermilchOrder_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "WgHafermilchOrder_wgId_date_idx"
    ON "WgHafermilchOrder"("wgId", "date");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WgHafermilchOrder_wgId_fkey') THEN
    ALTER TABLE "WgHafermilchOrder" ADD CONSTRAINT "WgHafermilchOrder_wgId_fkey"
      FOREIGN KEY ("wgId") REFERENCES "Wg"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "WgHafermilchPayment" (
    "id"          TEXT NOT NULL,
    "wgId"        TEXT NOT NULL,
    "fromId"      TEXT NOT NULL,
    "toId"        TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "date"        DATE NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WgHafermilchPayment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "WgHafermilchPayment_wgId_date_idx"
    ON "WgHafermilchPayment"("wgId", "date");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WgHafermilchPayment_wgId_fkey') THEN
    ALTER TABLE "WgHafermilchPayment" ADD CONSTRAINT "WgHafermilchPayment_wgId_fkey"
      FOREIGN KEY ("wgId") REFERENCES "Wg"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
