-- AlterTable: Neue User-Pref, initial aus notifyActivityComment uebernommen
ALTER TABLE "users" ADD COLUMN "notifyMyPostsComment" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "shopping_item_comments" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shopping_item_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shopping_item_comments_itemId_idx" ON "shopping_item_comments"("itemId");

-- AddForeignKey
ALTER TABLE "shopping_item_comments" ADD CONSTRAINT "shopping_item_comments_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "shopping_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_item_comments" ADD CONSTRAINT "shopping_item_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
