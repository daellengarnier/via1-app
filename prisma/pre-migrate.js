const { PrismaClient } = require("@prisma/client");

// Laeuft im Container VOR "prisma migrate deploy" (siehe Dockerfile CMD).
// Zweck: Zustaende reparieren, die "migrate deploy" sonst dauerhaft
// blockieren wuerden — der Deploy laeuft mit "|| echo WARN" weiter und
// die App startet dann gegen ein veraltetes Schema.
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
    //    deploy" die Migration erneut versucht (alle unsere Migrationen
    //    sind idempotent oder laufen in einer Transaktion).
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

    // 3) Notfall-Schema fuer Spalten, ohne die der aktuelle Code nicht
    //    laeuft. Idempotent — falls die regulaere Migration schon durch
    //    ist, passiert nichts.
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatarUpdatedAt" TIMESTAMP(3)`
    );
    const backfilled = await prisma.$executeRawUnsafe(
      `UPDATE "users" SET "avatarUpdatedAt" = "updatedAt"
        WHERE "avatar" IS NOT NULL AND "avatarUpdatedAt" IS NULL`
    );
    console.log("pre-migrate: avatarUpdatedAt ensured, backfilled", backfilled);
  } catch (err) {
    console.log("pre-migrate: skipped -", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => process.exit(0));
