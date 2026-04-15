-- AlterTable
ALTER TABLE "sublets" ADD COLUMN "subtenantFullName" TEXT NOT NULL DEFAULT '',
                      ADD COLUMN "subtenantPhone" TEXT NOT NULL DEFAULT '',
                      ADD COLUMN "subtenantEmail" TEXT NOT NULL DEFAULT '';
