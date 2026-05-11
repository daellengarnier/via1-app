-- Haussitzungs-Tournus + Platzhalter-Termine fuer "Datum noch offen"
-- Tournus: Nordwind → Ostblock → Dreiecksbar → Kleenex → Family-WG → Bonzennest
-- Nordwind hatte zuletzt am 04.05.2026, jetzt ist Ostblock dran.

-- 1. Schema-Erweiterungen
ALTER TABLE "termine"
  ALTER COLUMN "date" DROP NOT NULL;

ALTER TABLE "termine"
  ADD COLUMN "isHaussitzung"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "responsibleWgId"  TEXT;

ALTER TABLE "termine"
  ADD CONSTRAINT "termine_responsibleWgId_fkey"
  FOREIGN KEY ("responsibleWgId") REFERENCES "Wg"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "termine_isHaussitzung_idx" ON "termine"("isHaussitzung");

-- 2. HaussitzungRotation-Tabelle
CREATE TABLE "HaussitzungRotation" (
  "id"        TEXT NOT NULL,
  "wgId"      TEXT NOT NULL UNIQUE,
  "position"  INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HaussitzungRotation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HaussitzungRotation_wgId_fkey"
    FOREIGN KEY ("wgId") REFERENCES "Wg"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "HaussitzungRotation_position_idx" ON "HaussitzungRotation"("position");

-- 3. Seed: Tournus-Reihenfolge
DO $$
DECLARE
  v_nordwind     TEXT;
  v_ostblock     TEXT;
  v_dreiecksbar  TEXT;
  v_kleenex      TEXT;
  v_family       TEXT;
  v_bonzennest   TEXT;
  v_author       TEXT;
BEGIN
  SELECT id INTO v_nordwind    FROM "Wg" WHERE LOWER(name) = 'nordwind'    LIMIT 1;
  SELECT id INTO v_ostblock    FROM "Wg" WHERE LOWER(name) = 'ostblock'    LIMIT 1;
  SELECT id INTO v_dreiecksbar FROM "Wg" WHERE LOWER(name) = 'dreiecksbar' LIMIT 1;
  SELECT id INTO v_kleenex     FROM "Wg" WHERE LOWER(name) = 'kleenex'     LIMIT 1;
  SELECT id INTO v_family      FROM "Wg" WHERE LOWER(name) IN ('family-wg', 'family wg') LIMIT 1;
  SELECT id INTO v_bonzennest  FROM "Wg" WHERE LOWER(name) = 'bonzennest'  LIMIT 1;

  IF v_nordwind IS NOT NULL THEN
    INSERT INTO "HaussitzungRotation" ("id", "wgId", "position", "createdAt", "updatedAt")
    VALUES ('hsr_nordwind', v_nordwind, 0, NOW(), NOW())
    ON CONFLICT ("wgId") DO UPDATE SET "position" = 0, "updatedAt" = NOW();
  END IF;
  IF v_ostblock IS NOT NULL THEN
    INSERT INTO "HaussitzungRotation" ("id", "wgId", "position", "createdAt", "updatedAt")
    VALUES ('hsr_ostblock', v_ostblock, 1, NOW(), NOW())
    ON CONFLICT ("wgId") DO UPDATE SET "position" = 1, "updatedAt" = NOW();
  END IF;
  IF v_dreiecksbar IS NOT NULL THEN
    INSERT INTO "HaussitzungRotation" ("id", "wgId", "position", "createdAt", "updatedAt")
    VALUES ('hsr_dreiecksbar', v_dreiecksbar, 2, NOW(), NOW())
    ON CONFLICT ("wgId") DO UPDATE SET "position" = 2, "updatedAt" = NOW();
  END IF;
  IF v_kleenex IS NOT NULL THEN
    INSERT INTO "HaussitzungRotation" ("id", "wgId", "position", "createdAt", "updatedAt")
    VALUES ('hsr_kleenex', v_kleenex, 3, NOW(), NOW())
    ON CONFLICT ("wgId") DO UPDATE SET "position" = 3, "updatedAt" = NOW();
  END IF;
  IF v_family IS NOT NULL THEN
    INSERT INTO "HaussitzungRotation" ("id", "wgId", "position", "createdAt", "updatedAt")
    VALUES ('hsr_family', v_family, 4, NOW(), NOW())
    ON CONFLICT ("wgId") DO UPDATE SET "position" = 4, "updatedAt" = NOW();
  END IF;
  IF v_bonzennest IS NOT NULL THEN
    INSERT INTO "HaussitzungRotation" ("id", "wgId", "position", "createdAt", "updatedAt")
    VALUES ('hsr_bonzennest', v_bonzennest, 5, NOW(), NOW())
    ON CONFLICT ("wgId") DO UPDATE SET "position" = 5, "updatedAt" = NOW();
  END IF;

  -- Author fuer die Seed-Termine: irgendein Admin
  SELECT id INTO v_author FROM users WHERE 'ADMIN' = ANY(roles) ORDER BY "createdAt" LIMIT 1;
  IF v_author IS NULL THEN
    SELECT id INTO v_author FROM users ORDER BY "createdAt" LIMIT 1;
  END IF;
  IF v_author IS NULL THEN
    RAISE NOTICE 'Kein User in DB — Sitzungs-Seed uebersprungen.';
    RETURN;
  END IF;

  -- 4. Letzte Haussitzung: Nordwind, 04.05.2026 18:30
  IF v_nordwind IS NOT NULL THEN
    INSERT INTO "termine" (
      "id", "title", "date", "location", "type", "organizer",
      "withDinner", "withAttendance",
      "sitzungsleitung", "protokollfuehrung",
      "isHaussitzung", "responsibleWgId",
      "createdById", "createdAt", "updatedAt"
    )
    VALUES (
      'init_hs_nordwind_0405',
      'Haussitzung',
      '2026-05-04 18:30:00'::TIMESTAMP,
      'Saal',
      'SITZUNG',
      'Nordwind',
      false, true,
      '', '',
      true, v_nordwind,
      v_author, NOW(), NOW()
    )
    ON CONFLICT ("id") DO NOTHING;
  END IF;

  -- 5. Naechste Haussitzung: Platzhalter fuer Ostblock (date = NULL)
  IF v_ostblock IS NOT NULL THEN
    INSERT INTO "termine" (
      "id", "title", "date", "location", "type", "organizer",
      "withDinner", "withAttendance",
      "sitzungsleitung", "protokollfuehrung",
      "isHaussitzung", "responsibleWgId",
      "createdById", "createdAt", "updatedAt"
    )
    VALUES (
      'init_hs_ostblock_pending',
      'Haussitzung',
      NULL,
      'Saal',
      'SITZUNG',
      'Ostblock',
      false, true,
      '', '',
      true, v_ostblock,
      v_author, NOW(), NOW()
    )
    ON CONFLICT ("id") DO NOTHING;
  END IF;
END $$;
