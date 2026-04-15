-- CreateTable
CREATE TABLE "room_damages" (
    "id" TEXT NOT NULL,
    "roomKey" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'klein',
    "reportedById" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_damages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "room_damages_roomKey_idx" ON "room_damages"("roomKey");

-- CreateIndex
CREATE INDEX "room_damages_resolvedAt_idx" ON "room_damages"("resolvedAt");

-- AddForeignKey
ALTER TABLE "room_damages" ADD CONSTRAINT "room_damages_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "sublets" (
    "id" TEXT NOT NULL,
    "roomKey" TEXT NOT NULL,
    "subtenantName" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sublets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sublets_roomKey_idx" ON "sublets"("roomKey");

-- CreateIndex
CREATE INDEX "sublets_fromDate_idx" ON "sublets"("fromDate");

-- AddForeignKey
ALTER TABLE "sublets" ADD CONSTRAINT "sublets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
