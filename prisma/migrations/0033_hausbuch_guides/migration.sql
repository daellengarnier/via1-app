-- Erweiterung Hausbuch: strukturierte Anleitungen, Bilder und interne Links
ALTER TABLE "hausbuch_articles"
  ADD COLUMN "summary" TEXT,
  ADD COLUMN "structured" JSONB,
  ADD COLUMN "type" TEXT NOT NULL DEFAULT 'INFO',
  ADD COLUMN "section" TEXT,
  ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "pinned" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PUBLISHED';

CREATE TABLE "hausbuch_images" (
  "id" TEXT NOT NULL,
  "articleId" TEXT NOT NULL,
  "data" TEXT NOT NULL,
  "caption" TEXT,
  "stepId" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hausbuch_images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hausbuch_article_links" (
  "id" TEXT NOT NULL,
  "fromId" TEXT NOT NULL,
  "toId" TEXT NOT NULL,
  "label" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hausbuch_article_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "hausbuch_articles_type_idx" ON "hausbuch_articles"("type");
CREATE INDEX "hausbuch_articles_section_idx" ON "hausbuch_articles"("section");
CREATE INDEX "hausbuch_images_articleId_idx" ON "hausbuch_images"("articleId");
CREATE INDEX "hausbuch_article_links_toId_idx" ON "hausbuch_article_links"("toId");
CREATE UNIQUE INDEX "hausbuch_article_links_fromId_toId_key" ON "hausbuch_article_links"("fromId", "toId");

ALTER TABLE "hausbuch_images" ADD CONSTRAINT "hausbuch_images_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "hausbuch_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hausbuch_article_links" ADD CONSTRAINT "hausbuch_article_links_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "hausbuch_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hausbuch_article_links" ADD CONSTRAINT "hausbuch_article_links_toId_fkey" FOREIGN KEY ("toId") REFERENCES "hausbuch_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
