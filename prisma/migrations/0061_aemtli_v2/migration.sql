-- Aemtli v2 nach family-wg-Style:
-- - eine Rotation pro WG (statt mehrere Aemtli mit Intervallen)
-- - Pflicht-Tasks abhaken bevor "erledigt" moeglich
-- - Bonus-Tasks separat mit "letztens-von-wem"
-- - Swap-Requests
--
-- Alte Tabellen droppen (wir hatten erst Defaults rein gesseedet, kein Daten-Verlust).

DROP TABLE IF EXISTS "WgAemtliErledigung";
DROP TABLE IF EXISTS "WgAemtli";

CREATE TABLE "WgAemtliState" (
  "id"             TEXT NOT NULL,
  "wgId"           TEXT NOT NULL,
  "rotationOrder"  TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "currentIndex"   INTEGER NOT NULL DEFAULT 0,
  "lastDoneById"   TEXT,
  "lastDoneAt"     TIMESTAMP(3),
  "checkedPflicht" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "customBonus"    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WgAemtliState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WgAemtliState_wgId_key" ON "WgAemtliState"("wgId");

ALTER TABLE "WgAemtliState" ADD CONSTRAINT "WgAemtliState_wgId_fkey"
  FOREIGN KEY ("wgId") REFERENCES "Wg"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WgAemtliState" ADD CONSTRAINT "WgAemtliState_lastDoneById_fkey"
  FOREIGN KEY ("lastDoneById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "WgAemtliRound" (
  "id"        TEXT NOT NULL,
  "stateId"   TEXT NOT NULL,
  "byUserId"  TEXT NOT NULL,
  "doneAt"    TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WgAemtliRound_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WgAemtliRound_stateId_doneAt_idx" ON "WgAemtliRound"("stateId", "doneAt");

ALTER TABLE "WgAemtliRound" ADD CONSTRAINT "WgAemtliRound_stateId_fkey"
  FOREIGN KEY ("stateId") REFERENCES "WgAemtliState"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WgAemtliRound" ADD CONSTRAINT "WgAemtliRound_byUserId_fkey"
  FOREIGN KEY ("byUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WgAemtliBonusLog" (
  "id"        TEXT NOT NULL,
  "stateId"   TEXT NOT NULL,
  "taskName"  TEXT NOT NULL,
  "byUserId"  TEXT NOT NULL,
  "date"      TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WgAemtliBonusLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WgAemtliBonusLog_stateId_taskName_key" ON "WgAemtliBonusLog"("stateId", "taskName");

ALTER TABLE "WgAemtliBonusLog" ADD CONSTRAINT "WgAemtliBonusLog_stateId_fkey"
  FOREIGN KEY ("stateId") REFERENCES "WgAemtliState"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WgAemtliBonusLog" ADD CONSTRAINT "WgAemtliBonusLog_byUserId_fkey"
  FOREIGN KEY ("byUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WgAemtliSwap" (
  "id"         TEXT NOT NULL,
  "stateId"    TEXT NOT NULL,
  "fromUserId" TEXT NOT NULL,
  "toUserId"   TEXT NOT NULL,
  "status"     TEXT NOT NULL DEFAULT 'pending',
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WgAemtliSwap_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WgAemtliSwap_stateId_status_idx" ON "WgAemtliSwap"("stateId", "status");

ALTER TABLE "WgAemtliSwap" ADD CONSTRAINT "WgAemtliSwap_stateId_fkey"
  FOREIGN KEY ("stateId") REFERENCES "WgAemtliState"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WgAemtliSwap" ADD CONSTRAINT "WgAemtliSwap_fromUserId_fkey"
  FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WgAemtliSwap" ADD CONSTRAINT "WgAemtliSwap_toUserId_fkey"
  FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
