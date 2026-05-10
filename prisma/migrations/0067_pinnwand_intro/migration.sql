-- Intro-Post auf der Pinnwand der Family-WG, der den "Meine WG"-Bereich
-- kurz erklaert. Idempotent via fixer ID + ON CONFLICT DO NOTHING.
DO $$
DECLARE
  v_wg   TEXT;
  v_user TEXT;
BEGIN
  SELECT id INTO v_wg FROM "Wg" WHERE LOWER(name) = 'family-wg' LIMIT 1;
  IF v_wg IS NULL THEN
    RAISE NOTICE 'Family-WG nicht gefunden — Intro-Post uebersprungen.';
    RETURN;
  END IF;

  -- Author: erster verfuegbarer Bewohner der WG (Yves, Paola, sonst irgendein Member)
  SELECT u.id INTO v_user
  FROM users u JOIN "Room" r ON r.id = u."roomId"
  WHERE r."wgId" = v_wg
  ORDER BY CASE LOWER(u.name)
    WHEN 'yves' THEN 1
    WHEN 'paola' THEN 2
    WHEN 'mike' THEN 3
    ELSE 9
  END
  LIMIT 1;

  IF v_user IS NULL THEN
    RAISE NOTICE 'Kein WG-Bewohner gefunden — Intro-Post uebersprungen.';
    RETURN;
  END IF;

  INSERT INTO "WgPinnwandNote" (
    "id", "wgId", "text", "color", "authorId", "createdAt", "updatedAt"
  )
  VALUES (
    'init_meine_wg_intro',
    v_wg,
    E'📌 Willkommen im WG-Bereich!\n\nHier organisieren wir unser WG-Leben:\n🍳 Kochplan — wer kocht wann, wer isst mit\n🛒 Einkauf — gemeinsame Liste\n🧹 Ämtli — Putz-Rotation\n📅 Termine + Doodles — Sitzungen, Geburtstage\n📌 Pinnwand — Nachrichten an alle (wie diese hier!)\n\nAuf der Übersicht siehst du das Wichtigste auf einen Blick. Tippe auf eine Kachel für Details. 👋',
    'yellow',
    v_user,
    NOW(),
    NOW()
  )
  ON CONFLICT ("id") DO NOTHING;
END $$;
