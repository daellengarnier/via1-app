-- Family-WG Aemtli: Korrekte Rotation-Reihenfolge.
-- Soll-Reihenfolge: Miguelito → Daellen → Yves → Paola → Davina → Zoe → Nici → Ro
-- Daellen ist aktuell dran (Index 1), Miguelito hat zuletzt geputzt (06.05).
--
-- Setzt rotationOrder + currentIndex hart auf den Soll-Stand.
-- Idempotent: kann mehrfach laufen.

DO $$
DECLARE
  v_wg        TEXT;
  v_state     TEXT;
  v_miguelito TEXT;
  v_daellen   TEXT;
  v_yves      TEXT;
  v_paola     TEXT;
  v_davina    TEXT;
  v_zoe       TEXT;
  v_nici      TEXT;
  v_ro        TEXT;
  v_order     TEXT[];
BEGIN
  SELECT id INTO v_wg FROM "Wg" WHERE LOWER(name) = 'family-wg' LIMIT 1;
  IF v_wg IS NULL THEN
    RAISE NOTICE 'Family-WG nicht gefunden.';
    RETURN;
  END IF;

  SELECT id INTO v_state FROM "WgAemtliState" WHERE "wgId" = v_wg LIMIT 1;
  IF v_state IS NULL THEN
    RAISE NOTICE 'Family-WG hat noch keinen WgAemtliState.';
    RETURN;
  END IF;

  SELECT id INTO v_miguelito FROM users
   WHERE LOWER(name) = 'miguelito' OR LOWER("fullName") LIKE '%miguelito%'
   ORDER BY CASE WHEN LOWER(name) = 'miguelito' THEN 1 ELSE 2 END LIMIT 1;
  SELECT id INTO v_daellen FROM users
   WHERE LOWER(name) IN ('dällen', 'daellen', 'dallen', 'alain')
   ORDER BY CASE WHEN LOWER(name) = 'dällen' THEN 1
                 WHEN LOWER(name) = 'daellen' THEN 2
                 ELSE 3 END LIMIT 1;
  SELECT id INTO v_yves   FROM users WHERE LOWER(name) = 'yves' LIMIT 1;
  SELECT id INTO v_paola  FROM users WHERE LOWER(name) IN ('paola', 'paola.') LIMIT 1;
  SELECT id INTO v_davina FROM users WHERE LOWER(name) = 'davina' LIMIT 1;
  SELECT id INTO v_zoe    FROM users WHERE LOWER(name) = 'zoe' LIMIT 1;
  SELECT id INTO v_nici   FROM users WHERE LOWER(name) = 'nici' LIMIT 1;
  SELECT id INTO v_ro     FROM users WHERE LOWER(name) = 'ro' LIMIT 1;

  v_order := ARRAY(
    SELECT u FROM unnest(ARRAY[
      v_miguelito, v_daellen, v_yves, v_paola,
      v_davina, v_zoe, v_nici, v_ro
    ]) AS u
    WHERE u IS NOT NULL
  );

  IF array_length(v_order, 1) < 4 THEN
    RAISE NOTICE 'Zu wenige Family-WG User gefunden — Migration uebersprungen.';
    RETURN;
  END IF;

  -- Index 1 = Daellen (Position 2 in der Soll-Reihenfolge, 0-basiert).
  -- Falls Daellen fehlt, faellt der Index auf 0 (= erster verfuegbarer).
  UPDATE "WgAemtliState"
     SET "rotationOrder" = v_order,
         "currentIndex"  = CASE
           WHEN v_daellen IS NOT NULL
             THEN COALESCE(array_position(v_order, v_daellen), 1) - 1
           ELSE 0
         END,
         "updatedAt" = NOW()
   WHERE "id" = v_state;
END $$;
