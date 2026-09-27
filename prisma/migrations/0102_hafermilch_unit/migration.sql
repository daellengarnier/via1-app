-- Hafermilch: neben Kartons auch einzelne Packungen (1.5 l und 1 l)
-- erfassbar, je mit eigenem Standardpreis. Additiv, idempotent.

ALTER TABLE "WgHafermilchSettings"
  ADD COLUMN IF NOT EXISTS "singleCents" INTEGER NOT NULL DEFAULT 415;
ALTER TABLE "WgHafermilchSettings"
  ADD COLUMN IF NOT EXISTS "single1lCents" INTEGER NOT NULL DEFAULT 290;
ALTER TABLE "WgHafermilchSettings"
  ADD COLUMN IF NOT EXISTS "carton1lCents" INTEGER NOT NULL DEFAULT 1740;

ALTER TABLE "WgHafermilchOrder"
  ADD COLUMN IF NOT EXISTS "unit" TEXT NOT NULL DEFAULT 'carton';
