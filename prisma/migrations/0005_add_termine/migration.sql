-- CreateEnum
CREATE TYPE "TerminType" AS ENUM ('SITZUNG', 'ESSEN', 'SONSTIGE');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('GOING', 'NOT_GOING');

-- CreateEnum
CREATE TYPE "Diet" AS ENUM ('FLEISCH', 'VEGI', 'VEGAN');

-- CreateTable
CREATE TABLE "termine" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "type" "TerminType" NOT NULL,
    "organizer" TEXT,
    "withDinner" BOOLEAN NOT NULL DEFAULT false,
    "dinnerTime" TEXT,
    "withAttendance" BOOLEAN NOT NULL DEFAULT false,
    "sitzungsleitung" TEXT NOT NULL DEFAULT '',
    "protokollfuehrung" TEXT NOT NULL DEFAULT '',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "termine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "termine_date_idx" ON "termine"("date");

-- CreateTable
CREATE TABLE "traktanden" (
    "id" TEXT NOT NULL,
    "terminId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "traktanden_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "traktanden_terminId_idx" ON "traktanden"("terminId");

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "terminId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendances_terminId_userId_key" ON "attendances"("terminId", "userId");

-- CreateTable
CREATE TABLE "meal_signups" (
    "id" TEXT NOT NULL,
    "terminId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "diet" "Diet" NOT NULL,
    "allergies" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_signups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meal_signups_terminId_userId_key" ON "meal_signups"("terminId", "userId");

-- CreateTable
CREATE TABLE "meal_signup_guests" (
    "id" TEXT NOT NULL,
    "mealSignupId" TEXT NOT NULL,
    "diet" "Diet" NOT NULL,
    "allergies" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_signup_guests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meal_signup_guests_mealSignupId_idx" ON "meal_signup_guests"("mealSignupId");

-- AddForeignKey
ALTER TABLE "termine" ADD CONSTRAINT "termine_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traktanden" ADD CONSTRAINT "traktanden_terminId_fkey" FOREIGN KEY ("terminId") REFERENCES "termine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traktanden" ADD CONSTRAINT "traktanden_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_terminId_fkey" FOREIGN KEY ("terminId") REFERENCES "termine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_signups" ADD CONSTRAINT "meal_signups_terminId_fkey" FOREIGN KEY ("terminId") REFERENCES "termine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_signups" ADD CONSTRAINT "meal_signups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_signup_guests" ADD CONSTRAINT "meal_signup_guests_mealSignupId_fkey" FOREIGN KEY ("mealSignupId") REFERENCES "meal_signups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
