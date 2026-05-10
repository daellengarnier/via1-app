-- Force-set Family-WG Aemtli auf Daellen als naechsten dran.
-- Falls Migration 0062 nicht durchgelaufen ist oder der State seitdem
-- versehentlich weitergeruckt wurde, korrigiert das hier.

DO $$
DECLARE
  v_wg_id     TEXT;
  v_state_id  TEXT;
  v_daellen   TEXT;
  v_mike      TEXT;
  v_pos       INT;
BEGIN
  SELECT id INTO v_wg_id FROM "Wg" WHERE LOWER(name) = 'family-wg' LIMIT 1;
  IF v_wg_id IS NULL THEN
    RAISE NOTICE 'Family-WG nicht gefunden';
    RETURN;
  END IF;

  SELECT id INTO v_state_id FROM "WgAemtliState" WHERE "wgId" = v_wg_id;
  IF v_state_id IS NULL THEN
    RAISE NOTICE 'WgAemtliState fuer Family-WG nicht gefunden';
    RETURN;
  END IF;

  SELECT id INTO v_daellen FROM users
    WHERE LOWER(name) IN ('dällen', 'daellen', 'dallen') LIMIT 1;
  SELECT id INTO v_mike    FROM users WHERE LOWER(name) = 'mike' LIMIT 1;

  IF v_daellen IS NULL THEN
    RAISE NOTICE 'Daellen nicht gefunden';
    RETURN;
  END IF;

  -- Index von Daellen in der Rotation finden
  SELECT (idx - 1) INTO v_pos
  FROM (
    SELECT generate_subscripts("rotationOrder", 1) AS idx, "rotationOrder"
    FROM "WgAemtliState"
    WHERE id = v_state_id
  ) sub
  WHERE "rotationOrder"[idx] = v_daellen
  LIMIT 1;

  IF v_pos IS NULL THEN
    RAISE NOTICE 'Daellen ist nicht in der rotationOrder. State wird neu seeded.';
    -- Fallback: setze rotationOrder neu
    UPDATE "WgAemtliState"
    SET
      "rotationOrder" = ARRAY(
        SELECT u FROM unnest(ARRAY[
          (SELECT id FROM users WHERE LOWER(name) = 'davina'  LIMIT 1),
          (SELECT id FROM users WHERE LOWER(name) = 'zoe'     LIMIT 1),
          (SELECT id FROM users WHERE LOWER(name) = 'nici'    LIMIT 1),
          (SELECT id FROM users WHERE LOWER(name) = 'ro'      LIMIT 1),
          (SELECT id FROM users WHERE LOWER(name) = 'mike'    LIMIT 1),
          v_daellen,
          (SELECT id FROM users WHERE LOWER(name) = 'yves'    LIMIT 1),
          (SELECT id FROM users WHERE LOWER(name) = 'paola'   LIMIT 1)
        ]) AS u
        WHERE u IS NOT NULL
      ),
      "currentIndex"  = 5,
      "lastDoneById"  = v_mike,
      "lastDoneAt"    = '2026-05-06 12:00:00'::TIMESTAMP,
      "checkedPflicht" = ARRAY[]::TEXT[],
      "updatedAt"     = NOW()
    WHERE id = v_state_id;
  ELSE
    -- Setze currentIndex auf den Index von Daellen, plus reset checkedPflicht
    UPDATE "WgAemtliState"
    SET
      "currentIndex"   = v_pos,
      "lastDoneById"   = COALESCE("lastDoneById", v_mike),
      "lastDoneAt"     = COALESCE("lastDoneAt", '2026-05-06 12:00:00'::TIMESTAMP),
      "checkedPflicht" = ARRAY[]::TEXT[],
      "updatedAt"      = NOW()
    WHERE id = v_state_id;
  END IF;
END $$;
