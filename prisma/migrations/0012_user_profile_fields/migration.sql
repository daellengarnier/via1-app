-- AlterTable
ALTER TABLE "users" ADD COLUMN "fullName" TEXT;
ALTER TABLE "users" ADD COLUMN "birthday" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "diet" "Diet";
ALTER TABLE "users" ADD COLUMN "allergies" TEXT;
ALTER TABLE "users" ADD COLUMN "notifyTermine" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "notifyAufgaben" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "notifySauna" BOOLEAN NOT NULL DEFAULT true;
