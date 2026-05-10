-- CreateTable
CREATE TABLE "aufgabe_images" (
    "id" TEXT NOT NULL,
    "aufgabeId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aufgabe_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aufgabe_images_aufgabeId_position_idx" ON "aufgabe_images"("aufgabeId", "position");

-- AddForeignKey
ALTER TABLE "aufgabe_images" ADD CONSTRAINT "aufgabe_images_aufgabeId_fkey" FOREIGN KEY ("aufgabeId") REFERENCES "aufgaben"("id") ON DELETE CASCADE ON UPDATE CASCADE;
