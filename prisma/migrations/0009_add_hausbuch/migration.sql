-- CreateTable
CREATE TABLE "hausbuch_articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hausbuch_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hausbuch_articles_category_idx" ON "hausbuch_articles"("category");

-- AddForeignKey
ALTER TABLE "hausbuch_articles" ADD CONSTRAINT "hausbuch_articles_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
