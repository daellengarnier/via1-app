const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  try {
    const staleNames = [
      "0033_hausbuch_app_guide",
      "0034_putzplan_db",
      "0035_kaffee_db",
      "0036_feedback_table",
      "0037_rename_bonzen",
    ];

    const result = await prisma.$executeRawUnsafe(
      `DELETE FROM _prisma_migrations WHERE migration_name = ANY($1)`,
      staleNames
    );

    console.log("pre-migrate: cleaned up", result, "stale migration(s)");
  } catch (err) {
    console.log("pre-migrate: skipped -", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => process.exit(0));
