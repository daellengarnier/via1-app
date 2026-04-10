-- CreateEnum
CREATE TYPE "Side" AS ENUM ('NORD', 'OST');

-- CreateTable
CREATE TABLE "Wg" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "side" "Side" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "keyNumber" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "wgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- AlterTable: User bekommt roomId
ALTER TABLE "User" ADD COLUMN "roomId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Wg_name_key" ON "Wg"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Room_keyNumber_key" ON "Room"("keyNumber");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_wgId_fkey" FOREIGN KEY ("wgId") REFERENCES "Wg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
