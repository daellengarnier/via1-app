-- Author des Intro-Post auf der Family-WG-Pinnwand auf Daellen (Alain)
-- umstellen — vorher war es per Heuristik (Yves zuerst). Idempotent:
-- wenn Daellen nicht gefunden wird, bleibt der bestehende Author.
DO $$
DECLARE
  v_user TEXT;
BEGIN
  -- Daellen finden: per Name, fullName oder Email (breiter Match wie bei
  -- den Admin-Promotions zuvor).
  SELECT id INTO v_user
  FROM users
  WHERE LOWER(name) IN ('dällen', 'daellen', 'dallen', 'alain')
     OR LOWER("fullName") LIKE '%dällen%'
     OR LOWER("fullName") LIKE '%daellen%'
     OR LOWER("fullName") LIKE '%alain%'
     OR LOWER(email) LIKE 'alain%'
     OR LOWER(email) LIKE '%daellengarnier%'
  ORDER BY
    CASE WHEN LOWER(name) = 'dällen' THEN 1
         WHEN LOWER(name) = 'daellen' THEN 2
         WHEN LOWER(name) = 'alain' THEN 3
         ELSE 9
    END
  LIMIT 1;

  IF v_user IS NULL THEN
    RAISE NOTICE 'Daellen nicht gefunden — Intro-Post-Author unveraendert.';
    RETURN;
  END IF;

  UPDATE "WgPinnwandNote"
     SET "authorId" = v_user,
         "updatedAt" = NOW()
   WHERE "id" = 'init_meine_wg_intro';
END $$;
