ALTER TYPE "NotificationKind" ADD VALUE IF NOT EXISTS 'LAUNDRY_DONE';

ALTER TABLE "users"
  ADD COLUMN "notifyLaundry" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "laundry_timers" (
  "id" TEXT NOT NULL,
  "machineKey" TEXT NOT NULL,
  "machineName" TEXT NOT NULL,
  "programName" TEXT NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "stoppedAt" TIMESTAMP(3),
  "notificationSentAt" TIMESTAMP(3),
  "starterId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "laundry_timers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "laundry_timers_machineKey_endsAt_idx"
  ON "laundry_timers"("machineKey", "endsAt");

CREATE INDEX "laundry_timers_starterId_idx"
  ON "laundry_timers"("starterId");

ALTER TABLE "laundry_timers"
  ADD CONSTRAINT "laundry_timers_starterId_fkey"
  FOREIGN KEY ("starterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "laundry_timer_watches" (
  "id" TEXT NOT NULL,
  "timerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "laundry_timer_watches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "laundry_timer_watches_timerId_userId_key"
  ON "laundry_timer_watches"("timerId", "userId");

CREATE INDEX "laundry_timer_watches_userId_idx"
  ON "laundry_timer_watches"("userId");

ALTER TABLE "laundry_timer_watches"
  ADD CONSTRAINT "laundry_timer_watches_timerId_fkey"
  FOREIGN KEY ("timerId") REFERENCES "laundry_timers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "laundry_timer_watches"
  ADD CONSTRAINT "laundry_timer_watches_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
