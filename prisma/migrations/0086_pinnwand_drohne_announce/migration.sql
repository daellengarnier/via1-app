-- Pinnwand-Notiz von Daellen die das Drohne-Feature ankuendigt.
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
    RAISE NOTICE 'Daellen nicht gefunden — Drohne-Notiz uebersprungen.';
    RETURN;
  END IF;

  INSERT INTO "pinnwand_notes" ("id", "text", "authorId", "createdAt", "updatedAt")
  VALUES (
    'announce_drohne_2026',
    E'🚁 Drohne in der App\n\nWenn Livio oder Johann mit der Drohne unterwegs sind, siehst du sie hier in der App über die Startseite kreisen.\n\nFühlst du dich gestört? Fang die Drohne mit einem Klick und reich direkt eine Beschwerde ein — sie fliegt dann mit der Drohne als Sprechblase mit. Im selben Fenster siehst du auch die Historie aller bisherigen Flüge.',
    v_daellen,
    NOW(),
    NOW()
  )
  ON CONFLICT ("id") DO NOTHING;
END $$;
