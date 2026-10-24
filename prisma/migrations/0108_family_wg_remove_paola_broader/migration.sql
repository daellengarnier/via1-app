-- Fix: 0107 hat Paola nicht entfernt (vermutlich weil ihr display name
-- nicht genau 'paola' ist, sondern z.B. "Paola Gutierrez" oder "Paola G").
-- Breiterer Match: alles was mit 'paola' anfaengt UND in der Family-WG
-- liegt. Dadurch bleibt es dennoch sicher auf diese eine Person begrenzt.
-- Idempotent und defensiv gewrappt — darf nie den Deploy abbrechen.

DO $$
DECLARE
  v_wg       TEXT;
  v_state    TEXT;
  v_paola    TEXT;
  v_daellen  TEXT;
  v_order    TEXT[];
  v_newOrder TEXT[];
  v_newIndex INT;
BEGIN
  SELECT id INTO v_wg FROM "Wg" WHERE LOWER(name) = 'family-wg' LIMIT 1;
  IF v_wg IS NULL THEN
    RAISE NOTICE 'Family-WG nicht gefunden.';
    RETURN;
  END IF;

  SELECT id, "rotationOrder" INTO v_state, v_order
    FROM "WgAemtliState" WHERE "wgId" = v_wg LIMIT 1;
  IF v_state IS NULL THEN
    RAISE NOTICE 'Family-WG hat noch keinen WgAemtliState.';
    RETURN;
  END IF;

  -- Paola: alle User deren name/fullName mit 'paola' anfaengt UND
  -- aktuell in der Family-WG-Rotation drin sind (sicherer Match).
  SELECT u.id INTO v_paola FROM users u
   WHERE (LOWER(u.name) LIKE 'paola%' OR LOWER(COALESCE(u."fullName",'')) LIKE 'paola%')
     AND u.id = ANY(v_order)
   LIMIT 1;

  SELECT id INTO v_daellen FROM users
   WHERE LOWER(name) IN ('dällen', 'daellen', 'dallen', 'alain')
   ORDER BY CASE WHEN LOWER(name) = 'dällen' THEN 1
                 WHEN LOWER(name) = 'daellen' THEN 2
                 WHEN LOWER(name) = 'dallen'  THEN 3
                 ELSE 4 END LIMIT 1;

  IF v_paola IS NULL THEN
    RAISE NOTICE 'Keine Paola in der Family-WG-Rotation gefunden — nichts zu tun.';
    RETURN;
  END IF;

  -- Paola rausfiltern
  v_newOrder := ARRAY(
    SELECT u FROM unnest(v_order) AS u WHERE u IS DISTINCT FROM v_paola
  );

  -- currentIndex auf Daellen setzen, sonst Index 0
  IF v_daellen IS NOT NULL AND array_position(v_newOrder, v_daellen) IS NOT NULL THEN
    v_newIndex := array_position(v_newOrder, v_daellen) - 1;
  ELSE
    v_newIndex := 0;
  END IF;

  -- Immer schreiben (kein Guard — robust)
  UPDATE "WgAemtliState"
     SET "rotationOrder" = v_newOrder,
         "currentIndex"  = v_newIndex,
         "checkedPflicht" = ARRAY[]::TEXT[],
         "updatedAt" = NOW()
   WHERE "id" = v_state;

  RAISE NOTICE 'Family-WG rotation: Paola entfernt (% → % Members), currentIndex=%',
    array_length(v_order, 1), array_length(v_newOrder, 1), v_newIndex;
EXCEPTION WHEN OTHERS THEN
  -- Niemals den Deploy abbrechen
  RAISE NOTICE 'remove-paola migration failed: %', SQLERRM;
END $$;
