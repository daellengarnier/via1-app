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
