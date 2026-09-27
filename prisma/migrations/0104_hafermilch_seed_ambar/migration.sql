-- Einmaliger Daten-Import: Ambars Oatly-Bestellungen (2 Kartons am
-- 21.07., 1 Karton am 31.08., je 6 x 1.5 l, CHF 24.90) in Alains WG.
-- Gleiche Absicherung wie 0103: nur wenn alle 5 Personen eindeutig
-- gefunden werden. Feste IDs: idempotent.

DO $$
DECLARE
  v_ambar TEXT;
  v_wg    TEXT;
  v_ids   TEXT[];
  v_cnt   INT;
BEGIN
  SELECT r."wgId" INTO v_wg
    FROM users u
    LEFT JOIN "Room" r ON r.id = u."roomId"
   WHERE lower(u.name) = 'dällen' AND u."passwordSet" = TRUE
   LIMIT 1;
  SELECT id INTO v_ambar FROM users
   WHERE lower(name) = 'ambar' AND "passwordSet" = TRUE LIMIT 1;
  IF v_ambar IS NULL OR v_wg IS NULL THEN
    RAISE NOTICE 'hafermilch seed ambar: Ambar oder WG nicht gefunden, uebersprungen';
    RETURN;
  END IF;

  SELECT array_agg(id), count(*) INTO v_ids, v_cnt
    FROM users
   WHERE lower(name) IN ('dällen', 'nici', 'davina', 'ambar', 'ro')
     AND "passwordSet" = TRUE;
  IF v_cnt <> 5 THEN
    RAISE NOTICE 'hafermilch seed ambar: % von 5 Personen gefunden, uebersprungen', v_cnt;
    RETURN;
  END IF;

  INSERT INTO "WgHafermilchOrder"
    (id, "wgId", "boughtById", date, unit, quantity, "unitCents", "participantIds", "createdById", "createdAt")
  VALUES
    ('hm-seed-ambar-2026-07-21', v_wg, v_ambar, DATE '2026-07-21', 'carton', 2, 2490, v_ids, v_ambar, NOW()),
    ('hm-seed-ambar-2026-08-31', v_wg, v_ambar, DATE '2026-08-31', 'carton', 1, 2490, v_ids, v_ambar, NOW())
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'hafermilch seed ambar: ok';
END $$;
