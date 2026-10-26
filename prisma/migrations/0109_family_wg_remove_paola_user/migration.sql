-- Paola aus der Family-WG rausnehmen (Variante B, siehe CLAUDE.md-Chat):
--   1. Zimmer-Zuordnung aufheben (roomId → NULL)  → nicht mehr Mitglied
--   2. Login deaktivieren (passwordSet=false, password=NULL)
--   3. Falls noch in WgHafermilchSettings.participantIds enthalten, raus
--   4. Falls noch in WgAemtliState.rotationOrder → raus (Fallback zu 0108)
-- User-Row bleibt bewusst erhalten, damit alte Hafermilch-Bestellungen und
-- Zahlungen weiterhin ihren Namen anzeigen (Historie + offene Schulden).
-- Idempotent + defensiv gewrappt: darf den Deploy nie abbrechen.

DO $$
DECLARE
  v_wg      TEXT;
  v_paola   TEXT;
  v_state   TEXT;
  v_order   TEXT[];
  v_setting TEXT;
  v_parts   TEXT[];
BEGIN
  SELECT id INTO v_wg FROM "Wg" WHERE LOWER(name) = 'family-wg' LIMIT 1;
  IF v_wg IS NULL THEN
    RAISE NOTICE 'Family-WG nicht gefunden.';
    RETURN;
  END IF;

  -- Paola: der User mit name/fullName LIKE 'paola%' der (noch) ein Zimmer
  -- in der Family-WG hat ODER in deren Rotation/Settings auftaucht.
  SELECT u.id INTO v_paola FROM users u
    LEFT JOIN "Room" r ON r.id = u."roomId"
   WHERE (LOWER(u.name) LIKE 'paola%' OR LOWER(COALESCE(u."fullName",'')) LIKE 'paola%')
     AND (
       r."wgId" = v_wg
       OR EXISTS (
         SELECT 1 FROM "WgAemtliState" s
          WHERE s."wgId" = v_wg AND u.id = ANY(s."rotationOrder")
       )
       OR EXISTS (
         SELECT 1 FROM "WgHafermilchSettings" h
          WHERE h."wgId" = v_wg AND u.id = ANY(h."participantIds")
       )
     )
   LIMIT 1;

  IF v_paola IS NULL THEN
    RAISE NOTICE 'Keine Paola in der Family-WG gefunden — vermutlich bereits entfernt.';
    RETURN;
  END IF;

  -- 1 + 2: Zimmer-Zuordnung & Login
  UPDATE users
     SET "roomId"      = NULL,
         "passwordSet" = FALSE,
         password      = NULL,
         "updatedAt"   = NOW()
   WHERE id = v_paola;

  -- 3: aus Hafermilch-participantIds entfernen
  SELECT id, "participantIds" INTO v_setting, v_parts
    FROM "WgHafermilchSettings" WHERE "wgId" = v_wg LIMIT 1;
  IF v_setting IS NOT NULL AND v_paola = ANY(v_parts) THEN
    UPDATE "WgHafermilchSettings"
       SET "participantIds" = ARRAY(
             SELECT u FROM unnest(v_parts) AS u WHERE u IS DISTINCT FROM v_paola
           ),
           "updatedAt" = NOW()
     WHERE id = v_setting;
  END IF;

  -- 4: Fallback — aus WgAemtliState.rotationOrder entfernen (sollte durch
  --    0108 schon weg sein, aber doppelt haelt besser)
  SELECT id, "rotationOrder" INTO v_state, v_order
    FROM "WgAemtliState" WHERE "wgId" = v_wg LIMIT 1;
  IF v_state IS NOT NULL AND v_paola = ANY(v_order) THEN
    UPDATE "WgAemtliState"
       SET "rotationOrder" = ARRAY(
             SELECT u FROM unnest(v_order) AS u WHERE u IS DISTINCT FROM v_paola
           ),
           "updatedAt" = NOW()
     WHERE id = v_state;
  END IF;

  RAISE NOTICE 'Paola (%) aus Family-WG rausgenommen.', v_paola;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'remove-paola-user migration failed: %', SQLERRM;
END $$;
