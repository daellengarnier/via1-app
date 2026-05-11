-- Verbindungs-Spalte WgKochKind.familyKidId fuer Auto-Sync zwischen
-- globalem FamilyKid-Modell und WG-spezifischem WgKochKind. Plus
-- Initial-Backfill: erstellt fuer jede FamilyKid einen WgKochKind in
-- der WG jedes Elternteils (so kann z.B. Zoe ihre Kinder Nori/Yondu
-- im Family-WG-Kochplan mit-anmelden).

ALTER TABLE "WgKochKind" ADD COLUMN "familyKidId" TEXT;
CREATE INDEX "WgKochKind_familyKidId_idx" ON "WgKochKind"("familyKidId");

-- Backfill: ein WgKochKind pro (FamilyKid, WG-der-Eltern)-Kombination.
-- Idempotent via (wgId, familyKidId).
INSERT INTO "WgKochKind" (
  "id", "wgId", "name", "parentIds", "familyKidId", "createdAt", "updatedAt"
)
SELECT
  'fk_' || fk."id" || '_' || r."wgId",
  r."wgId",
  fk."name",
  ARRAY(
    SELECT DISTINCT p."B"
      FROM "_FamilyKidParents" p
     WHERE p."A" = fk."id"
  ),
  fk."id",
  NOW(),
  NOW()
FROM "FamilyKid" fk
JOIN "_FamilyKidParents" fp ON fp."A" = fk."id"
JOIN users u                ON u."id" = fp."B"
JOIN "Room" r               ON r."id" = u."roomId"
GROUP BY fk."id", fk."name", r."wgId"
ON CONFLICT ("id") DO NOTHING;
