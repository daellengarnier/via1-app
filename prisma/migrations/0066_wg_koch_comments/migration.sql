-- Kommentare zu einzelnen Kochplan-Eintraegen
-- (z.B. Pizza-Bestellungen, Allergien, "ich nehme die Margherita")
CREATE TABLE "WgKochComment" (
  "id"        TEXT NOT NULL,
  "eintragId" TEXT NOT NULL,
  "authorId"  TEXT NOT NULL,
  "text"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WgKochComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WgKochComment_eintragId_idx" ON "WgKochComment"("eintragId");

ALTER TABLE "WgKochComment" ADD CONSTRAINT "WgKochComment_eintragId_fkey"
  FOREIGN KEY ("eintragId") REFERENCES "WgKochEintrag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WgKochComment" ADD CONSTRAINT "WgKochComment_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
