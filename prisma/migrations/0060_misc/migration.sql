-- 1) Putzplan: Reihenfolge fix nach User-Wunsch.
--    Nordwind = vorgestern fertig, Bonzennest ist als naechstes dran,
--    danach Family-WG, Kleenex, Dreiecksbar, Ostblock.
--
-- Mit ON CONFLICT (wg) — falls eine WG fehlt wird sie angelegt,
-- ansonsten nur "order" und "completedAt" gesetzt.
INSERT INTO "putzplan_entries" ("id", "wg", "order", "completedAt", "createdAt", "updatedAt")
VALUES
  ('init_v2_nordwind',     'Nordwind',     0, NOW() - INTERVAL '2 days', NOW(), NOW()),
  ('init_v2_bonzennest',   'Bonzennest',   1, NULL,                       NOW(), NOW()),
  ('init_v2_familywg',     'Family-WG',    2, NULL,                       NOW(), NOW()),
  ('init_v2_kleenex',      'Kleenex',      3, NULL,                       NOW(), NOW()),
  ('init_v2_dreiecksbar',  'Dreiecksbar',  4, NULL,                       NOW(), NOW()),
  ('init_v2_ostblock',     'Ostblock',     5, NULL,                       NOW(), NOW())
ON CONFLICT ("wg") DO UPDATE SET
  "order"       = EXCLUDED."order",
  "completedAt" = EXCLUDED."completedAt",
  "updatedAt"   = NOW();

-- 2) Einkaufslisten-Kommentare pro WG
CREATE TABLE "WgEinkaufComment" (
  "id"        TEXT NOT NULL,
  "einkaufId" TEXT NOT NULL,
  "authorId"  TEXT NOT NULL,
  "text"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WgEinkaufComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WgEinkaufComment_einkaufId_idx" ON "WgEinkaufComment"("einkaufId");

ALTER TABLE "WgEinkaufComment" ADD CONSTRAINT "WgEinkaufComment_einkaufId_fkey"
  FOREIGN KEY ("einkaufId") REFERENCES "WgEinkauf"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WgEinkaufComment" ADD CONSTRAINT "WgEinkaufComment_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
