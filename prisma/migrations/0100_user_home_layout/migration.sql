-- Individuelle Home-Anordnung pro Person (JSON, siehe
-- src/lib/home-layout.ts). NULL = Standard-Reihenfolge. Additiv.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "homeLayout" JSONB;
