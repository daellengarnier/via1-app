-- CreateTable
CREATE TABLE "pinnwand_comments" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pinnwand_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pinnwand_comments_noteId_idx" ON "pinnwand_comments"("noteId");

-- AddForeignKey
ALTER TABLE "pinnwand_comments" ADD CONSTRAINT "pinnwand_comments_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "pinnwand_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pinnwand_comments" ADD CONSTRAINT "pinnwand_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
