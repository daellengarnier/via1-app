-- CreateTable
CREATE TABLE "aufgaben" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "done" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "pinLat" DOUBLE PRECISION,
    "pinLng" DOUBLE PRECISION,
    "assignee" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aufgaben_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aufgaben_done_createdAt_idx" ON "aufgaben"("done", "createdAt");

-- CreateTable
CREATE TABLE "aufgabe_active_workers" (
    "id" TEXT NOT NULL,
    "aufgabeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aufgabe_active_workers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aufgabe_active_workers_aufgabeId_userId_key" ON "aufgabe_active_workers"("aufgabeId", "userId");

-- AddForeignKey
ALTER TABLE "aufgaben" ADD CONSTRAINT "aufgaben_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aufgabe_active_workers" ADD CONSTRAINT "aufgabe_active_workers_aufgabeId_fkey" FOREIGN KEY ("aufgabeId") REFERENCES "aufgaben"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aufgabe_active_workers" ADD CONSTRAINT "aufgabe_active_workers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
