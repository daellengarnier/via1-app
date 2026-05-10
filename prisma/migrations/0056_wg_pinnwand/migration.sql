-- Private WG-Pinnwand: Post-Its mit Farbe + Kommentaren
CREATE TABLE "WgPinnwandNote" (
  "id"        TEXT NOT NULL,
  "wgId"      TEXT NOT NULL,
  "text"      TEXT NOT NULL,
  "color"     TEXT NOT NULL DEFAULT 'yellow',
  "authorId"  TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WgPinnwandNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WgPinnwandNote_wgId_createdAt_idx"
  ON "WgPinnwandNote"("wgId", "createdAt");

ALTER TABLE "WgPinnwandNote" ADD CONSTRAINT "WgPinnwandNote_wgId_fkey"
  FOREIGN KEY ("wgId") REFERENCES "Wg"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WgPinnwandNote" ADD CONSTRAINT "WgPinnwandNote_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WgPinnwandComment" (
  "id"        TEXT NOT NULL,
  "noteId"    TEXT NOT NULL,
  "authorId"  TEXT NOT NULL,
  "text"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WgPinnwandComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WgPinnwandComment_noteId_idx" ON "WgPinnwandComment"("noteId");

ALTER TABLE "WgPinnwandComment" ADD CONSTRAINT "WgPinnwandComment_noteId_fkey"
  FOREIGN KEY ("noteId") REFERENCES "WgPinnwandNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WgPinnwandComment" ADD CONSTRAINT "WgPinnwandComment_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
