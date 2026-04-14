-- AlterTable
ALTER TABLE "hausbuch_articles" ADD COLUMN "createdById" TEXT;

-- AddForeignKey
ALTER TABLE "hausbuch_articles" ADD CONSTRAINT "hausbuch_articles_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
