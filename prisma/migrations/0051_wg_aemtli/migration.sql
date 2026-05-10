-- Aemtli (Putzplan/Hausarbeiten) pro WG mit Rotation
CREATE TABLE "WgAemtli" (
  "id"           TEXT NOT NULL,
  "wgId"         TEXT NOT NULL,
  "title"        TEXT NOT NULL,
  "description"  TEXT,
  "intervalDays" INTEGER NOT NULL DEFAULT 7,
  "mandatory"    BOOLEAN NOT NULL DEFAULT false,
  "order"        INTEGER NOT NULL DEFAULT 0,
  "active"       BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WgAemtli_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WgAemtli_wgId_order_idx" ON "WgAemtli"("wgId", "order");

ALTER TABLE "WgAemtli" ADD CONSTRAINT "WgAemtli_wgId_fkey"
  FOREIGN KEY ("wgId") REFERENCES "Wg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WgAemtliErledigung" (
  "id"       TEXT NOT NULL,
  "aemtliId" TEXT NOT NULL,
  "userId"   TEXT NOT NULL,
  "doneAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes"    TEXT,
  CONSTRAINT "WgAemtliErledigung_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WgAemtliErledigung_aemtliId_doneAt_idx"
  ON "WgAemtliErledigung"("aemtliId", "doneAt");

ALTER TABLE "WgAemtliErledigung" ADD CONSTRAINT "WgAemtliErledigung_aemtliId_fkey"
  FOREIGN KEY ("aemtliId") REFERENCES "WgAemtli"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WgAemtliErledigung" ADD CONSTRAINT "WgAemtliErledigung_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
