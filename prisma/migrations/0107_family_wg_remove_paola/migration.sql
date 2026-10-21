-- Paola ist aus der Family-WG ausgezogen → aus der Aemtli-Rotation entfernen.
-- Nach Entfernung ist Daellen als naechstes dran.
-- Idempotent: kann mehrfach laufen, aendert nur bei Bedarf etwas.

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

  SELECT id INTO v_paola FROM users
   WHERE LOWER(name) IN ('paola', 'paola.') LIMIT 1;
  SELECT id INTO v_daellen FROM users
   WHERE LOWER(name) IN ('dällen', 'daellen', 'dallen', 'alain')
   ORDER BY CASE WHEN LOWER(name) = 'dällen' THEN 1
                 WHEN LOWER(name) = 'daellen' THEN 2
                 ELSE 3 END LIMIT 1;

  -- Paola aus der Rotation entfernen (NULL-safe: falls Paola nicht
  -- gefunden wurde, bleibt v_order unveraendert)
  IF v_paola IS NOT NULL THEN
    v_newOrder := ARRAY(
      SELECT u FROM unnest(v_order) AS u WHERE u IS DISTINCT FROM v_paola
    );
  ELSE
    v_newOrder := v_order;
  END IF;

  -- Neuer currentIndex: Daellen, falls er in der Rotation ist, sonst 0
  IF v_daellen IS NOT NULL AND array_position(v_newOrder, v_daellen) IS NOT NULL THEN
    v_newIndex := array_position(v_newOrder, v_daellen) - 1;
  ELSE
    v_newIndex := 0;
  END IF;

  -- Nur schreiben wenn sich wirklich etwas aendert (Idempotenz)
  IF v_newOrder <> v_order OR v_newIndex <> (
    SELECT "currentIndex" FROM "WgAemtliState" WHERE id = v_state
  ) THEN
    UPDATE "WgAemtliState"
       SET "rotationOrder" = v_newOrder,
           "currentIndex"  = v_newIndex,
           -- Pflicht-Haken fuer die neue Runde zuruecksetzen (frischer Start)
           "checkedPflicht" = ARRAY[]::TEXT[],
           "updatedAt" = NOW()
     WHERE "id" = v_state;
    RAISE NOTICE 'Family-WG rotation updated: % → % Members', array_length(v_order,1), array_length(v_newOrder,1);
  END IF;
END $$;
