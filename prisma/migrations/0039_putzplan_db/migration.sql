-- CreateTable
CREATE TABLE "putzplan_entries" (
    "id" TEXT NOT NULL,
    "wg" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "putzplan_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "putzplan_entries_wg_key" ON "putzplan_entries"("wg");
CREATE INDEX "putzplan_entries_order_idx" ON "putzplan_entries"("order");

-- Seed: Nordwind ist aktuell dran (Kleenex, Family-WG, Bonzen, Dreiecksbar, Ostblock schon durch)
INSERT INTO "putzplan_entries" ("id", "wg", "order", "completedAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'Kleenex',      0, '2026-03-20', NOW()),
  (gen_random_uuid()::text, 'Family-WG',    1, '2026-04-03', NOW()),
  (gen_random_uuid()::text, 'Bonzen',       2, '2026-04-10', NOW()),
  (gen_random_uuid()::text, 'Dreiecksbar',  3, '2026-04-17', NOW()),
  (gen_random_uuid()::text, 'Ostblock',     4, '2026-04-24', NOW()),
  (gen_random_uuid()::text, 'Nordwind',     5, NULL,          NOW());
