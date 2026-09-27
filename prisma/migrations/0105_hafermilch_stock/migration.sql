-- Hafermilch: Verbrauchsstatistik — Lieferzeit, letzter Vorrat.
-- Additiv, idempotent. Seed: Alains WG hat am 27.09.2026 noch 3 Flaschen.

ALTER TABLE "WgHafermilchSettings"
  ADD COLUMN IF NOT EXISTS "deliveryDays" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "WgHafermilchSettings"
  ADD COLUMN IF NOT EXISTS "stockCount" INTEGER;
ALTER TABLE "WgHafermilchSettings"
  ADD COLUMN IF NOT EXISTS "stockAt" DATE;

DO $$
DECLARE v_wg TEXT;
BEGIN
  SELECT r."wgId" INTO v_wg
    FROM users u LEFT JOIN "Room" r ON r.id = u."roomId"
   WHERE lower(u.name) = 'dällen' AND u."passwordSet" = TRUE LIMIT 1;
  IF v_wg IS NULL THEN RETURN; END IF;
  UPDATE "WgHafermilchSettings"
     SET "stockCount" = 3, "stockAt" = DATE '2026-09-27', "updatedAt" = NOW()
   WHERE "wgId" = v_wg AND "stockAt" IS NULL;
END $$;
