-- CreateTable
CREATE TABLE "flohmi_inserate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "image" TEXT,
    "createdById" TEXT NOT NULL,
    "takenById" TEXT,
    "takenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flohmi_inserate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flohmi_inserate_createdAt_idx" ON "flohmi_inserate"("createdAt");

-- CreateIndex
CREATE INDEX "flohmi_inserate_takenAt_idx" ON "flohmi_inserate"("takenAt");

-- CreateTable
CREATE TABLE "flohmi_comments" (
    "id" TEXT NOT NULL,
    "inseratId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flohmi_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flohmi_comments_inseratId_idx" ON "flohmi_comments"("inseratId");

-- AddForeignKey
ALTER TABLE "flohmi_inserate" ADD CONSTRAINT "flohmi_inserate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flohmi_inserate" ADD CONSTRAINT "flohmi_inserate_takenById_fkey" FOREIGN KEY ("takenById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flohmi_comments" ADD CONSTRAINT "flohmi_comments_inseratId_fkey" FOREIGN KEY ("inseratId") REFERENCES "flohmi_inserate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flohmi_comments" ADD CONSTRAINT "flohmi_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
