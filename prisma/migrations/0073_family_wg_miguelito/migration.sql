-- Family-WG Aemtli korrigieren:
--   - Miguelito wurde in der Rotation vergessen — wird zwischen Mike
--     (Index 4) und Daellen (Index 5) eingefuegt.
--   - Der 06.05-Eintrag war faelschlich Mike zugeordnet — gehoert
--     Miguelito.
--   - Daellen bleibt als Naechstes dran (currentIndex 6 statt 5).
--
-- Idempotent: prueft ob Miguelito schon drin ist, prueft Eintraege.

DO $$
DECLARE
  v_wg         TEXT;
  v_state      TEXT;
  v_miguelito  TEXT;
  v_mike       TEXT;
  v_daellen    TEXT;
  v_old_order  TEXT[];
  v_new_order  TEXT[];
  v_mig_idx    INT;
BEGIN
  SELECT id INTO v_wg FROM "Wg" WHERE LOWER(name) = 'family-wg' LIMIT 1;
  IF v_wg IS NULL THEN
    RAISE NOTICE 'Family-WG nicht gefunden.';
    RETURN;
  END IF;

  SELECT id INTO v_miguelito
    FROM users
   WHERE LOWER(name) = 'miguelito'
      OR LOWER("fullName") LIKE '%miguelito%'
   ORDER BY CASE WHEN LOWER(name) = 'miguelito' THEN 1 ELSE 2 END
   LIMIT 1;

  SELECT id INTO v_mike    FROM users WHERE LOWER(name) = 'mike' LIMIT 1;
  SELECT id INTO v_daellen FROM users
   WHERE LOWER(name) IN ('dällen', 'daellen', 'dallen', 'alain')
   ORDER BY CASE WHEN LOWER(name) = 'dällen' THEN 1
                 WHEN LOWER(name) = 'daellen' THEN 2
                 ELSE 3 END
   LIMIT 1;

  IF v_miguelito IS NULL THEN
    RAISE NOTICE 'Miguelito nicht gefunden — Migration uebersprungen.';
    RETURN;
  END IF;

  SELECT "id", "rotationOrder" INTO v_state, v_old_order
    FROM "WgAemtliState" WHERE "wgId" = v_wg LIMIT 1;
  IF v_state IS NULL THEN
    RAISE NOTICE 'Family-WG hat noch keinen WgAemtliState.';
    RETURN;
  END IF;

  -- Miguelito in die Rotation einfuegen, falls noch nicht drin
  IF NOT (v_miguelito = ANY(v_old_order)) THEN
    -- Position: direkt nach Mike. Wenn Mike nicht in Rotation, am Ende.
    SELECT array_position(v_old_order, v_mike) INTO v_mig_idx;
    IF v_mig_idx IS NULL THEN
      v_new_order := v_old_order || ARRAY[v_miguelito];
    ELSE
      v_new_order := (v_old_order)[1:v_mig_idx]
                  || ARRAY[v_miguelito]
                  || (v_old_order)[v_mig_idx + 1 : array_length(v_old_order, 1)];
    END IF;

    -- currentIndex anpassen: wenn die alte dran-Position >= Miguelitos
    -- Einfuegestelle war, eins weiterruecken (sonst wuerde Miguelito
    -- die naechste Person verschieben).
    UPDATE "WgAemtliState"
       SET "rotationOrder" = v_new_order,
           "currentIndex" = CASE
             WHEN "currentIndex" >= v_mig_idx THEN "currentIndex" + 1
             ELSE "currentIndex"
           END,
           "updatedAt" = NOW()
     WHERE "id" = v_state;
  END IF;

  -- Mike's 06.05-Eintrag durch Miguelito ersetzen.
  -- Idempotent: wenn schon Miguelito-Eintrag fuer 06.05 da, nichts tun.
  IF NOT EXISTS (
    SELECT 1 FROM "WgAemtliRound"
     WHERE "stateId" = v_state
       AND "byUserId" = v_miguelito
       AND DATE("doneAt") = '2026-05-06'
  ) THEN
    -- Mike-06.05-Eintrag entfernen falls vorhanden
    DELETE FROM "WgAemtliRound"
     WHERE "id" = 'init_family_round_mike'
        OR ("stateId" = v_state
            AND "byUserId" = v_mike
            AND DATE("doneAt") = '2026-05-06');

    INSERT INTO "WgAemtliRound" ("id", "stateId", "byUserId", "doneAt")
    VALUES (
      'init_family_round_miguelito_0506',
      v_state,
      v_miguelito,
      '2026-05-06 12:00:00'::TIMESTAMP
    )
    ON CONFLICT ("id") DO NOTHING;
  END IF;

  -- lastDoneBy auf Miguelito setzen, wenn nichts Neueres drinsteht
  UPDATE "WgAemtliState"
     SET "lastDoneById" = v_miguelito,
         "lastDoneAt"   = '2026-05-06 12:00:00'::TIMESTAMP,
         "updatedAt"    = NOW()
   WHERE "id" = v_state
     AND ("lastDoneAt" IS NULL OR "lastDoneAt" <= '2026-05-06 23:59:59'::TIMESTAMP);
END $$;
