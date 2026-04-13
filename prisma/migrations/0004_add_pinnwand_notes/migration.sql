-- CreateTable
CREATE TABLE "pinnwand_notes" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pinnwand_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pinnwand_notes_createdAt_idx" ON "pinnwand_notes"("createdAt");

-- AddForeignKey
ALTER TABLE "pinnwand_notes" ADD CONSTRAINT "pinnwand_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
