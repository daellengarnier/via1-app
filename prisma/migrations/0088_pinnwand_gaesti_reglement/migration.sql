-- Pinnwand-Notiz von Daellen die das Gaestewohnwagen-Reglement
-- ankuendigt. Idempotent via fixer ID + ON CONFLICT DO NOTHING.

DO $$
DECLARE
  v_daellen TEXT;
BEGIN
  SELECT id INTO v_daellen
    FROM users
   WHERE LOWER(name) IN ('dällen', 'daellen', 'dallen', 'alain')
      OR LOWER("fullName") LIKE '%dällen%'
      OR LOWER("fullName") LIKE '%daellen%'
      OR LOWER("fullName") LIKE '%alain%'
      OR LOWER(email) LIKE '%daellengarnier%'
   ORDER BY
     CASE WHEN LOWER(name) = 'dällen' THEN 1
          WHEN LOWER(name) = 'daellen' THEN 2
          WHEN LOWER(name) = 'alain' THEN 3
          ELSE 9
     END
   LIMIT 1;

  IF v_daellen IS NULL THEN
    RAISE NOTICE 'Daellen nicht gefunden — Gaesti-Reglement-Notiz uebersprungen.';
    RETURN;
  END IF;

  INSERT INTO "pinnwand_notes" ("id", "text", "authorId", "createdAt", "updatedAt")
  VALUES (
    'announce_gaesti_reglement_2026',
    E'🚐 Reglement Gästewohnwagen\n\nDas Reglement ist jetzt direkt auf der Gästewohnwagen-Seite einsehbar (Tab „Gästi" → unten ausklappen).\n\nDanke an Elena, Mara und Davina von der AG Gästewohnwagen für die Erarbeitung! 🙏',
    v_daellen,
    NOW(),
    NOW()
  )
  ON CONFLICT ("id") DO NOTHING;
END $$;
