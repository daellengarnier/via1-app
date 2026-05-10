-- Einkaufsliste pro WG
CREATE TABLE "WgEinkauf" (
  "id"          TEXT NOT NULL,
  "wgId"        TEXT NOT NULL,
  "text"        TEXT NOT NULL,
  "done"        BOOLEAN NOT NULL DEFAULT false,
  "doneAt"      TIMESTAMP(3),
  "doneById"    TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WgEinkauf_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WgEinkauf_wgId_done_createdAt_idx"
  ON "WgEinkauf"("wgId", "done", "createdAt");

ALTER TABLE "WgEinkauf" ADD CONSTRAINT "WgEinkauf_wgId_fkey"
  FOREIGN KEY ("wgId") REFERENCES "Wg"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WgEinkauf" ADD CONSTRAINT "WgEinkauf_doneById_fkey"
  FOREIGN KEY ("doneById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WgEinkauf" ADD CONSTRAINT "WgEinkauf_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
