const { PrismaClient } = require("@prisma/client");

// Laeuft im Container VOR "prisma migrate deploy" (siehe Dockerfile CMD).
// Zweck: Zustaende reparieren, die "migrate deploy" sonst dauerhaft
// blockieren wuerden — der Deploy laeuft mit "|| echo WARN" weiter und
// die App startet dann gegen ein veraltetes Schema.
//
// Abschnitt 3 ("ensure") legt Schema-Teile idempotent an, ohne die der
// aktuelle Code nicht laeuft. Jede Migration, die eine Spalte/Tabelle
// hinzufuegt, die sofort gebraucht wird, gehoert auch hier rein —
// solange nicht sicher ist, dass "migrate deploy" auf dem Server
// zuverlaessig durchlaeuft.

function fkGuard(table, constraint, column, refTable) {
  return `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${constraint}') THEN
      ALTER TABLE "${table}" ADD CONSTRAINT "${constraint}"
        FOREIGN KEY ("${column}") REFERENCES "${refTable}"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`;
}

// Implizite Prisma-M2M-Tabelle: "A" → aTable, "B" → bTable.
function m2m(table, aTable, bTable) {
  return [
    `CREATE TABLE IF NOT EXISTS "${table}" (
      "A" TEXT NOT NULL,
      "B" TEXT NOT NULL,
      CONSTRAINT "${table}_AB_pkey" PRIMARY KEY ("A","B")
    )`,
    `CREATE INDEX IF NOT EXISTS "${table}_B_index" ON "${table}"("B")`,
    fkGuard(table, `${table}_A_fkey`, "A", aTable),
    fkGuard(table, `${table}_B_fkey`, "B", bTable),
  ];
}

const ENSURE_SQL = [
  // 0097
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatarUpdatedAt" TIMESTAMP(3)`,
  `UPDATE "users" SET "avatarUpdatedAt" = "updatedAt"
     WHERE "avatar" IS NOT NULL AND "avatarUpdatedAt" IS NULL`,
  // 0098
  `ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "audienceType" TEXT NOT NULL DEFAULT 'ALL'`,
  ...m2m("_ActivityAudienceUsers", "activities", "users"),
  ...m2m("_ActivityAudienceWgs", "activities", "Wg"),
  // 0099
  `ALTER TABLE "termine" ADD COLUMN IF NOT EXISTS "audienceType" TEXT NOT NULL DEFAULT 'ALL'`,
  ...m2m("_TerminAudienceUsers", "termine", "users"),
  ...m2m("_TerminAudienceWgs", "termine", "Wg"),
  // 0100
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "homeLayout" JSONB`,
  // 0101 — Oatly-Hafermilch-Kasse
  `CREATE TABLE IF NOT EXISTS "WgHafermilchSettings" (
    "id" TEXT NOT NULL, "wgId" TEXT NOT NULL,
    "participantIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "unitCents" INTEGER NOT NULL DEFAULT 2490,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WgHafermilchSettings_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "WgHafermilchSettings_wgId_key" ON "WgHafermilchSettings"("wgId")`,
  fkGuard("WgHafermilchSettings", "WgHafermilchSettings_wgId_fkey", "wgId", "Wg"),
  `CREATE TABLE IF NOT EXISTS "WgHafermilchOrder" (
    "id" TEXT NOT NULL, "wgId" TEXT NOT NULL, "boughtById" TEXT NOT NULL,
    "date" DATE NOT NULL, "quantity" INTEGER NOT NULL, "unitCents" INTEGER NOT NULL,
    "participantIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WgHafermilchOrder_pkey" PRIMARY KEY ("id"))`,
  `CREATE INDEX IF NOT EXISTS "WgHafermilchOrder_wgId_date_idx" ON "WgHafermilchOrder"("wgId", "date")`,
  fkGuard("WgHafermilchOrder", "WgHafermilchOrder_wgId_fkey", "wgId", "Wg"),
  `CREATE TABLE IF NOT EXISTS "WgHafermilchPayment" (
    "id" TEXT NOT NULL, "wgId" TEXT NOT NULL, "fromId" TEXT NOT NULL, "toId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL, "date" DATE NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WgHafermilchPayment_pkey" PRIMARY KEY ("id"))`,
  `CREATE INDEX IF NOT EXISTS "WgHafermilchPayment_wgId_date_idx" ON "WgHafermilchPayment"("wgId", "date")`,
  fkGuard("WgHafermilchPayment", "WgHafermilchPayment_wgId_fkey", "wgId", "Wg"),
  // 0102
  `ALTER TABLE "WgHafermilchSettings" ADD COLUMN IF NOT EXISTS "singleCents" INTEGER NOT NULL DEFAULT 415`,
  `ALTER TABLE "WgHafermilchSettings" ADD COLUMN IF NOT EXISTS "single1lCents" INTEGER NOT NULL DEFAULT 290`,
  `ALTER TABLE "WgHafermilchSettings" ADD COLUMN IF NOT EXISTS "carton1lCents" INTEGER NOT NULL DEFAULT 1740`,
  `ALTER TABLE "WgHafermilchOrder" ADD COLUMN IF NOT EXISTS "unit" TEXT NOT NULL DEFAULT 'carton'`,
  // 0103 — einmaliger Daten-Import (idempotent, feste IDs; siehe Migration)
  `DO $$
  DECLARE v_daellen TEXT; v_wg TEXT; v_ids TEXT[]; v_cnt INT;
  BEGIN
    SELECT u.id, r."wgId" INTO v_daellen, v_wg
      FROM users u LEFT JOIN "Room" r ON r.id = u."roomId"
     WHERE lower(u.name) = 'dällen' AND u."passwordSet" = TRUE LIMIT 1;
    IF v_daellen IS NULL OR v_wg IS NULL THEN RETURN; END IF;
    SELECT array_agg(id), count(*) INTO v_ids, v_cnt FROM users
     WHERE lower(name) IN ('dällen','nici','davina','ambar','ro') AND "passwordSet" = TRUE;
    IF v_cnt <> 5 THEN RETURN; END IF;
    INSERT INTO "WgHafermilchSettings" (id, "wgId", "participantIds", "unitCents", "updatedAt")
    VALUES ('hm-seed-' || v_wg, v_wg, v_ids, 2490, NOW())
    ON CONFLICT ("wgId") DO UPDATE SET "participantIds" = EXCLUDED."participantIds", "updatedAt" = NOW()
      WHERE cardinality("WgHafermilchSettings"."participantIds") = 0;
    INSERT INTO "WgHafermilchOrder"
      (id, "wgId", "boughtById", date, unit, quantity, "unitCents", "participantIds", "createdById", "createdAt")
    VALUES
      ('hm-seed-daellen-2026-07-15', v_wg, v_daellen, DATE '2026-07-15', 'carton', 2, 2490, v_ids, v_daellen, NOW()),
      ('hm-seed-daellen-2026-08-07', v_wg, v_daellen, DATE '2026-08-07', 'carton', 1, 2490, v_ids, v_daellen, NOW()),
      ('hm-seed-daellen-2026-08-17', v_wg, v_daellen, DATE '2026-08-17', 'carton', 1, 2490, v_ids, v_daellen, NOW()),
      ('hm-seed-daellen-2026-08-21', v_wg, v_daellen, DATE '2026-08-21', 'carton', 1, 2490, v_ids, v_daellen, NOW()),
      ('hm-seed-daellen-2026-09-03', v_wg, v_daellen, DATE '2026-09-03', 'carton', 3, 2490, v_ids, v_daellen, NOW()),
      ('hm-seed-daellen-2026-09-27', v_wg, v_daellen, DATE '2026-09-27', 'carton', 3, 2490, v_ids, v_daellen, NOW())
    ON CONFLICT (id) DO NOTHING;
  END $$`,
  // 0104 — Ambars Bestellungen (idempotent)
  `DO $$
  DECLARE v_ambar TEXT; v_wg TEXT; v_ids TEXT[]; v_cnt INT;
  BEGIN
    SELECT r."wgId" INTO v_wg FROM users u LEFT JOIN "Room" r ON r.id = u."roomId"
     WHERE lower(u.name) = 'dällen' AND u."passwordSet" = TRUE LIMIT 1;
    SELECT id INTO v_ambar FROM users WHERE lower(name) = 'ambar' AND "passwordSet" = TRUE LIMIT 1;
    IF v_ambar IS NULL OR v_wg IS NULL THEN RETURN; END IF;
    SELECT array_agg(id), count(*) INTO v_ids, v_cnt FROM users
     WHERE lower(name) IN ('dällen','nici','davina','ambar','ro') AND "passwordSet" = TRUE;
    IF v_cnt <> 5 THEN RETURN; END IF;
    INSERT INTO "WgHafermilchOrder"
      (id, "wgId", "boughtById", date, unit, quantity, "unitCents", "participantIds", "createdById", "createdAt")
    VALUES
      ('hm-seed-ambar-2026-07-21', v_wg, v_ambar, DATE '2026-07-21', 'carton', 2, 2490, v_ids, v_ambar, NOW()),
      ('hm-seed-ambar-2026-08-31', v_wg, v_ambar, DATE '2026-08-31', 'carton', 1, 2490, v_ids, v_ambar, NOW())
    ON CONFLICT (id) DO NOTHING;
  END $$`,
];

async function main() {
  const prisma = new PrismaClient();
  try {
    // 1) Bekannte veraltete Migrations-Eintraege entfernen (historisch).
    const staleNames = [
      "0033_hausbuch_app_guide",
      "0034_putzplan_db",
      "0035_kaffee_db",
      "0036_feedback_table",
      "0037_rename_bonzen",
    ];
    const stale = await prisma.$executeRawUnsafe(
      `DELETE FROM _prisma_migrations WHERE migration_name = ANY($1)`,
      staleNames
    );
    console.log("pre-migrate: cleaned up", stale, "stale migration(s)");

    // 2) Fehlgeschlagene Migrationen (P3009) freigeben: ein Eintrag ohne
    //    finished_at und ohne rolled_back_at ist ein abgebrochener Lauf.
    //    Prisma weigert sich dann, IRGENDEINE weitere Migration auszu-
    //    fuehren. Wir loggen und loeschen den Eintrag, damit "migrate
    //    deploy" die Migration erneut versucht.
    const failed = await prisma.$queryRawUnsafe(
      `SELECT migration_name, started_at, logs
         FROM _prisma_migrations
        WHERE finished_at IS NULL AND rolled_back_at IS NULL`
    );
    for (const row of failed) {
      console.log(
        "pre-migrate: failed migration found, releasing:",
        row.migration_name,
        "| logs:",
        String(row.logs ?? "").slice(0, 300)
      );
    }
    if (failed.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM _prisma_migrations
          WHERE finished_at IS NULL AND rolled_back_at IS NULL`
      );
    }

    // Diagnose: die letzten angewendeten Migrationen ins Log, damit man
    // im Container-Log sofort sieht, wo die Kette steht.
    const recent = await prisma.$queryRawUnsafe(
      `SELECT migration_name, finished_at
         FROM _prisma_migrations
        ORDER BY started_at DESC
        LIMIT 5`
    );
    console.log(
      "pre-migrate: last migrations:",
      recent
        .map((r) => `${r.migration_name}${r.finished_at ? "" : " (unfinished)"}`)
        .join(", ")
    );

    // 3) Notfall-Schema (idempotent).
    let ensured = 0;
    for (const sql of ENSURE_SQL) {
      try {
        await prisma.$executeRawUnsafe(sql);
        ensured += 1;
      } catch (err) {
        console.log(
          "pre-migrate: ensure failed:",
          sql.slice(0, 80).replace(/\s+/g, " "),
          "→",
          err.message
        );
      }
    }
    console.log(`pre-migrate: ensured ${ensured}/${ENSURE_SQL.length} schema statements`);
  } catch (err) {
    console.log("pre-migrate: skipped -", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => process.exit(0));
