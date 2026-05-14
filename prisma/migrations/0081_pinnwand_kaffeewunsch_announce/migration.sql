-- Pinnwand-Notiz von Daellen die das neue Kaffeewuensche-Feature ankuendigt.
-- Idempotent via fixer ID + ON CONFLICT DO NOTHING.

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
    RAISE NOTICE 'Daellen nicht gefunden — Notiz uebersprungen.';
    RETURN;
  END IF;

  INSERT INTO "pinnwand_notes" ("id", "text", "authorId", "createdAt", "updatedAt")
  VALUES (
    'announce_kaffeewunsch_2026',
    E'☕ Kaffeewünsche!\n\nIm Tab „Kaffee" gibt''s neu die Sektion „💭 Kaffeewünsche". Tragt Kaffees ein die ihr probieren wollt oder die euch geschmeckt haben — ich berücksichtige sie bei der nächsten Bestellung.',
    v_daellen,
    NOW(),
    NOW()
  )
  ON CONFLICT ("id") DO NOTHING;
END $$;
