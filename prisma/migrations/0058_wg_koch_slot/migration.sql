-- Kochplan v3: pro Tag genau zwei Slots (Mittag/Abend),
-- Menu statt Titel und optional.
-- Bestehende Daten droppen (sauberer Neustart).
DELETE FROM "WgKochEintrag";

-- title -> menu, optional
ALTER TABLE "WgKochEintrag" RENAME COLUMN "title" TO "menu";
ALTER TABLE "WgKochEintrag" ALTER COLUMN "menu" DROP NOT NULL;

-- slot: "lunch" | "dinner"
ALTER TABLE "WgKochEintrag" ADD COLUMN "slot" TEXT NOT NULL DEFAULT 'dinner';
ALTER TABLE "WgKochEintrag" ALTER COLUMN "slot" DROP DEFAULT;

-- Pro WG genau einen Eintrag pro (Datum, Slot)
CREATE UNIQUE INDEX "WgKochEintrag_wgId_date_slot_key"
  ON "WgKochEintrag"("wgId", "date", "slot");
