-- CreateTable
CREATE TABLE "flohmi_images" (
    "id" TEXT NOT NULL,
    "inseratId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flohmi_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flohmi_images_inseratId_idx" ON "flohmi_images"("inseratId");

-- AddForeignKey
ALTER TABLE "flohmi_images" ADD CONSTRAINT "flohmi_images_inseratId_fkey" FOREIGN KEY ("inseratId") REFERENCES "flohmi_inserate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing single images into the new table
INSERT INTO "flohmi_images" ("id", "inseratId", "data", "order", "createdAt")
SELECT
  'mig_' || substring(md5(random()::text || id) from 1 for 20),
  id,
  image,
  0,
  NOW()
FROM "flohmi_inserate"
WHERE image IS NOT NULL;
