-- Family-WG Aemtli-Setup nach echtem Stand:
-- Reihenfolge: Davina, Zoe, Nici, Ro, Mike, Dällen, Yves, Paola
-- Mike war zuletzt am 06.05.2026 dran -> Dällen ist als naechstes dran (Index 5)
-- History (chronologisch): Davina 19.03, Paola 25.03, Zoe 09.04, Nici 17.04, Ro 23.04, Mike 06.05

DO $$
DECLARE
  v_wg_id        TEXT;
  v_state_id     TEXT;
  v_davina       TEXT;
  v_zoe          TEXT;
  v_nici         TEXT;
  v_ro           TEXT;
  v_mike         TEXT;
  v_daellen      TEXT;
  v_yves         TEXT;
  v_paola        TEXT;
  v_rotation     TEXT[];
BEGIN
  SELECT id INTO v_wg_id FROM "Wg" WHERE LOWER(name) = 'family-wg' LIMIT 1;
  IF v_wg_id IS NULL THEN
    RAISE NOTICE 'Family-WG nicht gefunden — Migration uebersprungen.';
    RETURN;
  END IF;

  -- User-IDs holen (case-insensitive). Daellen kann mit Ae oder ae geschrieben sein.
  SELECT id INTO v_davina  FROM users WHERE LOWER(name) = 'davina'  LIMIT 1;
  SELECT id INTO v_zoe     FROM users WHERE LOWER(name) = 'zoe'     LIMIT 1;
  SELECT id INTO v_nici    FROM users WHERE LOWER(name) = 'nici'    LIMIT 1;
  SELECT id INTO v_ro      FROM users WHERE LOWER(name) = 'ro'      LIMIT 1;
  SELECT id INTO v_mike    FROM users WHERE LOWER(name) = 'mike'    LIMIT 1;
  SELECT id INTO v_daellen FROM users WHERE LOWER(name) IN ('dällen', 'daellen', 'dallen') LIMIT 1;
  SELECT id INTO v_yves    FROM users WHERE LOWER(name) = 'yves'    LIMIT 1;
  SELECT id INTO v_paola   FROM users WHERE LOWER(name) IN ('paola', 'paola.') LIMIT 1;

  -- Rotation-Array bauen (NULLs werden ausgefiltert; falls jemand fehlt, ist die Reihenfolge entsprechend kuerzer)
  v_rotation := ARRAY(
    SELECT u FROM unnest(ARRAY[v_davina, v_zoe, v_nici, v_ro, v_mike, v_daellen, v_yves, v_paola]) AS u
    WHERE u IS NOT NULL
  );

  IF array_length(v_rotation, 1) < 6 THEN
    RAISE NOTICE 'Family-WG: zu wenige User in der Rotation — Migration uebersprungen.';
    RETURN;
  END IF;

  -- State upsert
  INSERT INTO "WgAemtliState" (
    "id", "wgId", "rotationOrder", "currentIndex",
    "lastDoneById", "lastDoneAt",
    "checkedPflicht", "customBonus",
    "createdAt", "updatedAt"
  )
  VALUES (
    'init_family_aemtli',
    v_wg_id,
    v_rotation,
    LEAST(5, array_length(v_rotation, 1) - 1),  -- nach Mike (Index 4) → Daellen (Index 5)
    v_mike,
    '2026-05-06 12:00:00'::TIMESTAMP,
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    NOW(), NOW()
  )
  ON CONFLICT ("wgId") DO UPDATE SET
    "rotationOrder" = EXCLUDED."rotationOrder",
    "currentIndex"  = EXCLUDED."currentIndex",
    "lastDoneById"  = EXCLUDED."lastDoneById",
    "lastDoneAt"    = EXCLUDED."lastDoneAt",
    "updatedAt"     = NOW();

  SELECT id INTO v_state_id FROM "WgAemtliState" WHERE "wgId" = v_wg_id;

  -- Bestehende History fuer diese WG droppen + neu eintragen (idempotent)
  DELETE FROM "WgAemtliRound" WHERE "stateId" = v_state_id;

  IF v_davina IS NOT NULL THEN
    INSERT INTO "WgAemtliRound" ("id", "stateId", "byUserId", "doneAt") VALUES
      ('init_family_round_davina', v_state_id, v_davina, '2026-03-19 12:00:00'::TIMESTAMP);
  END IF;
  IF v_paola IS NOT NULL THEN
    INSERT INTO "WgAemtliRound" ("id", "stateId", "byUserId", "doneAt") VALUES
      ('init_family_round_paola',  v_state_id, v_paola,  '2026-03-25 12:00:00'::TIMESTAMP);
  END IF;
  IF v_zoe IS NOT NULL THEN
    INSERT INTO "WgAemtliRound" ("id", "stateId", "byUserId", "doneAt") VALUES
      ('init_family_round_zoe',    v_state_id, v_zoe,    '2026-04-09 12:00:00'::TIMESTAMP);
  END IF;
  IF v_nici IS NOT NULL THEN
    INSERT INTO "WgAemtliRound" ("id", "stateId", "byUserId", "doneAt") VALUES
      ('init_family_round_nici',   v_state_id, v_nici,   '2026-04-17 12:00:00'::TIMESTAMP);
  END IF;
  IF v_ro IS NOT NULL THEN
    INSERT INTO "WgAemtliRound" ("id", "stateId", "byUserId", "doneAt") VALUES
      ('init_family_round_ro',     v_state_id, v_ro,     '2026-04-23 12:00:00'::TIMESTAMP);
  END IF;
  IF v_mike IS NOT NULL THEN
    INSERT INTO "WgAemtliRound" ("id", "stateId", "byUserId", "doneAt") VALUES
      ('init_family_round_mike',   v_state_id, v_mike,   '2026-05-06 12:00:00'::TIMESTAMP);
  END IF;
END $$;
