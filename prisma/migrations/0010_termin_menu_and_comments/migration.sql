-- AlterTable
ALTER TABLE "termine" ADD COLUMN "dinnerMenu" TEXT;

-- CreateTable
CREATE TABLE "termin_comments" (
    "id" TEXT NOT NULL,
    "terminId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "termin_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "termin_comments_terminId_idx" ON "termin_comments"("terminId");

-- AddForeignKey
ALTER TABLE "termin_comments" ADD CONSTRAINT "termin_comments_terminId_fkey" FOREIGN KEY ("terminId") REFERENCES "termine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "termin_comments" ADD CONSTRAINT "termin_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
