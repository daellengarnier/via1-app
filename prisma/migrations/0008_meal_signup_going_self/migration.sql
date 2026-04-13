-- AlterTable
ALTER TABLE "meal_signups" ADD COLUMN "goingSelf" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "termine" ADD COLUMN "dinnerLocation" TEXT;
ALTER TABLE "termine" ADD COLUMN "dinnerOrganizer" TEXT;
