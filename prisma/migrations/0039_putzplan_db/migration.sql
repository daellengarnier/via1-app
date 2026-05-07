-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "putzplan_entries" (
    "id" TEXT NOT NULL,
    "wg" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "putzplan_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS "putzplan_entries_wg_key" ON "putzplan_entries"("wg");
CREATE INDEX IF NOT EXISTS "putzplan_entries_order_idx" ON "putzplan_entries"("order");

-- Seed only if empty
INSERT INTO "putzplan_entries" ("id", "wg", "order", "completedAt", "updatedAt")
SELECT gen_random_uuid()::text, v.wg, v.ord, v.done, NOW()
FROM (VALUES
  ('Kleenex',      0, '2026-03-20'::timestamp),
  ('Family-WG',    1, '2026-04-03'::timestamp),
  ('Bonzennest',   2, '2026-04-10'::timestamp),
  ('Dreiecksbar',  3, '2026-04-17'::timestamp),
  ('Ostblock',     4, '2026-04-24'::timestamp),
  ('Nordwind',     5, NULL)
) AS v(wg, ord, done)
WHERE NOT EXISTS (SELECT 1 FROM "putzplan_entries" LIMIT 1);
