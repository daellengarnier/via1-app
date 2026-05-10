-- Initial-Seed der Familien-Kinder:
--   Nori    (VEGETARIAN) — Eltern: Yves + Zoe
--   Yondu   (OMNIVORE)   — Eltern: Yves + Zoe
--   Livio   (OMNIVORE)   — Eltern: Fam Stussi (1 Account)
--   Lilith  (OMNIVORE)   — Eltern: Fam Stussi
--   Mika    (OMNIVORE)   — Eltern: Mara
--   Milou   (OMNIVORE)   — Eltern: Lara (+ Baescht spaeter via UI)
--
-- Idempotent via fixe IDs + ON CONFLICT DO NOTHING. Wenn ein Kind-Eintrag
-- bereits existiert, werden Parent-Links nicht erneut erzeugt (UPSERT
-- waere komplex, und Eltern koennen via Profil-UI ergaenzt werden).

DO $$
DECLARE
  v_yves    TEXT;
  v_zoe     TEXT;
  v_stussi  TEXT;
  v_mara    TEXT;
  v_lara    TEXT;
BEGIN
  SELECT id INTO v_yves
    FROM users
   WHERE LOWER(name) = 'yves' OR LOWER("fullName") LIKE '%yves%'
   ORDER BY CASE WHEN LOWER(name) = 'yves' THEN 1 ELSE 2 END
   LIMIT 1;

  SELECT id INTO v_zoe
    FROM users
   WHERE LOWER(name) = 'zoe' OR LOWER("fullName") LIKE '%zoe%'
   ORDER BY CASE WHEN LOWER(name) = 'zoe' THEN 1 ELSE 2 END
   LIMIT 1;

  SELECT id INTO v_stussi
    FROM users
   WHERE LOWER(name) LIKE '%stussi%'
      OR LOWER(name) LIKE 'fam%stussi%'
      OR LOWER("fullName") LIKE '%stussi%'
   ORDER BY CASE WHEN LOWER(name) LIKE 'fam%stussi%' THEN 1 ELSE 2 END
   LIMIT 1;

  SELECT id INTO v_mara
    FROM users
   WHERE LOWER(name) = 'mara' OR LOWER("fullName") LIKE '%mara%'
   ORDER BY CASE WHEN LOWER(name) = 'mara' THEN 1 ELSE 2 END
   LIMIT 1;

  SELECT id INTO v_lara
    FROM users
   WHERE LOWER(name) = 'lara' OR LOWER("fullName") LIKE '%lara%'
   ORDER BY CASE WHEN LOWER(name) = 'lara' THEN 1 ELSE 2 END
   LIMIT 1;

  -- Nori
  INSERT INTO "FamilyKid" ("id", "name", "diet", "allergies", "createdAt", "updatedAt")
  VALUES ('seed_kid_nori', 'Nori', 'VEGI', '', NOW(), NOW())
  ON CONFLICT ("id") DO NOTHING;
  IF v_yves IS NOT NULL THEN
    INSERT INTO "_FamilyKidParents" ("A", "B") VALUES ('seed_kid_nori', v_yves)
    ON CONFLICT DO NOTHING;
  END IF;
  IF v_zoe IS NOT NULL THEN
    INSERT INTO "_FamilyKidParents" ("A", "B") VALUES ('seed_kid_nori', v_zoe)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Yondu
  INSERT INTO "FamilyKid" ("id", "name", "diet", "allergies", "createdAt", "updatedAt")
  VALUES ('seed_kid_yondu', 'Yondu', 'FLEISCH', '', NOW(), NOW())
  ON CONFLICT ("id") DO NOTHING;
  IF v_yves IS NOT NULL THEN
    INSERT INTO "_FamilyKidParents" ("A", "B") VALUES ('seed_kid_yondu', v_yves)
    ON CONFLICT DO NOTHING;
  END IF;
  IF v_zoe IS NOT NULL THEN
    INSERT INTO "_FamilyKidParents" ("A", "B") VALUES ('seed_kid_yondu', v_zoe)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Livio (Fam Stussi)
  INSERT INTO "FamilyKid" ("id", "name", "diet", "allergies", "createdAt", "updatedAt")
  VALUES ('seed_kid_livio', 'Livio', 'FLEISCH', '', NOW(), NOW())
  ON CONFLICT ("id") DO NOTHING;
  IF v_stussi IS NOT NULL THEN
    INSERT INTO "_FamilyKidParents" ("A", "B") VALUES ('seed_kid_livio', v_stussi)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Lilith (Fam Stussi)
  INSERT INTO "FamilyKid" ("id", "name", "diet", "allergies", "createdAt", "updatedAt")
  VALUES ('seed_kid_lilith', 'Lilith', 'FLEISCH', '', NOW(), NOW())
  ON CONFLICT ("id") DO NOTHING;
  IF v_stussi IS NOT NULL THEN
    INSERT INTO "_FamilyKidParents" ("A", "B") VALUES ('seed_kid_lilith', v_stussi)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Mika (Mara)
  INSERT INTO "FamilyKid" ("id", "name", "diet", "allergies", "createdAt", "updatedAt")
  VALUES ('seed_kid_mika', 'Mika', 'FLEISCH', '', NOW(), NOW())
  ON CONFLICT ("id") DO NOTHING;
  IF v_mara IS NOT NULL THEN
    INSERT INTO "_FamilyKidParents" ("A", "B") VALUES ('seed_kid_mika', v_mara)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Milou (Lara; Baescht noch nicht registriert — wird via UI ergaenzt)
  INSERT INTO "FamilyKid" ("id", "name", "diet", "allergies", "createdAt", "updatedAt")
  VALUES ('seed_kid_milou', 'Milou', 'FLEISCH', '', NOW(), NOW())
  ON CONFLICT ("id") DO NOTHING;
  IF v_lara IS NOT NULL THEN
    INSERT INTO "_FamilyKidParents" ("A", "B") VALUES ('seed_kid_milou', v_lara)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
