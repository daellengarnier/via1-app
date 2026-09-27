-- Einmaliger Daten-Import fuer die Oatly-Kasse (Alains WG): Mittrinkende
-- Dällen, Nici, Davina, Ambar, RO und Alains 11 Kartons (6 x 1.5 l,
-- CHF 24.90). Personen werden ueber den Anzeigenamen gefunden, die WG
-- ueber Alains Zimmer. Bei Unsicherheit (nicht genau 5 Treffer) passiert
-- nichts — dann wird manuell erfasst. Feste IDs: idempotent.

DO $$
DECLARE
  v_daellen TEXT;
  v_wg      TEXT;
  v_ids     TEXT[];
  v_cnt     INT;
BEGIN
  SELECT u.id, r."wgId" INTO v_daellen, v_wg
    FROM users u
    LEFT JOIN "Room" r ON r.id = u."roomId"
   WHERE lower(u.name) = 'dällen' AND u."passwordSet" = TRUE
   LIMIT 1;
  IF v_daellen IS NULL OR v_wg IS NULL THEN
    RAISE NOTICE 'hafermilch seed: Daellen oder WG nicht gefunden, uebersprungen';
    RETURN;
  END IF;

  SELECT array_agg(id), count(*) INTO v_ids, v_cnt
    FROM users
   WHERE lower(name) IN ('dällen', 'nici', 'davina', 'ambar', 'ro')
     AND "passwordSet" = TRUE;
  IF v_cnt <> 5 THEN
    RAISE NOTICE 'hafermilch seed: % von 5 Personen gefunden, uebersprungen', v_cnt;
    RETURN;
  END IF;

  INSERT INTO "WgHafermilchSettings" (id, "wgId", "participantIds", "unitCents", "updatedAt")
  VALUES ('hm-seed-' || v_wg, v_wg, v_ids, 2490, NOW())
  ON CONFLICT ("wgId") DO UPDATE
    SET "participantIds" = EXCLUDED."participantIds", "updatedAt" = NOW()
    WHERE cardinality("WgHafermilchSettings"."participantIds") = 0;

  INSERT INTO "WgHafermilchOrder"
    (id, "wgId", "boughtById", date, unit, quantity, "unitCents", "participantIds", "createdById", "createdAt")
  VALUES
    ('hm-seed-daellen-2026-07-15', v_wg, v_daellen, DATE '2026-07-15', 'carton', 2, 2490, v_ids, v_daellen, NOW()),
    ('hm-seed-daellen-2026-08-07', v_wg, v_daellen, DATE '2026-08-07', 'carton', 1, 2490, v_ids, v_daellen, NOW()),
    ('hm-seed-daellen-2026-08-17', v_wg, v_daellen, DATE '2026-08-17', 'carton', 1, 2490, v_ids, v_daellen, NOW()),
    ('hm-seed-daellen-2026-08-21', v_wg, v_daellen, DATE '2026-08-21', 'carton', 1, 2490, v_ids, v_daellen, NOW()),
    ('hm-seed-daellen-2026-09-03', v_wg, v_daellen, DATE '2026-09-03', 'carton', 3, 2490, v_ids, v_daellen, NOW()),
    ('hm-seed-daellen-2026-09-27', v_wg, v_daellen, DATE '2026-09-27', 'carton', 3, 2490, v_ids, v_daellen, NOW())
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'hafermilch seed: ok (wg %, % personen)', v_wg, v_cnt;
END $$;
