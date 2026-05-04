ALTER TABLE "room_damages"
  ADD COLUMN "title" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "location" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "category" TEXT NOT NULL DEFAULT 'allgemein',
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'gemeldet',
  ADD COLUMN "pinLat" DOUBLE PRECISION,
  ADD COLUMN "pinLng" DOUBLE PRECISION,
  ADD COLUMN "imageData" TEXT,
  ADD COLUMN "invoiceData" TEXT,
  ADD COLUMN "invoiceName" TEXT,
  ADD COLUMN "costCents" INTEGER,
  ADD COLUMN "appointmentAt" TIMESTAMP(3);

UPDATE "room_damages"
SET "title" = CASE
  WHEN length(trim("description")) > 60 THEN substring(trim("description") from 1 for 57) || '…'
  ELSE trim("description")
END,
"location" = COALESCE(NULLIF("roomKey", ''), "location"),
"status" = CASE WHEN "resolvedAt" IS NULL THEN 'gemeldet' ELSE 'erledigt' END
WHERE "title" = '';

CREATE TABLE "room_damage_feedbacks" (
  "id" TEXT NOT NULL,
  "damageId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "room_damage_feedbacks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "room_damages_category_idx" ON "room_damages"("category");
CREATE INDEX "room_damages_status_idx" ON "room_damages"("status");
CREATE INDEX "room_damage_feedbacks_damageId_idx" ON "room_damage_feedbacks"("damageId");

ALTER TABLE "room_damage_feedbacks" ADD CONSTRAINT "room_damage_feedbacks_damageId_fkey" FOREIGN KEY ("damageId") REFERENCES "room_damages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "room_damage_feedbacks" ADD CONSTRAINT "room_damage_feedbacks_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
