-- CreateTable
CREATE TABLE "kaffee_current" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "name" TEXT NOT NULL,
    "herkunft" TEXT NOT NULL DEFAULT '',
    "duftnotizen" TEXT NOT NULL DEFAULT '',
    "fairtrade" BOOLEAN NOT NULL DEFAULT false,
    "changedBy" TEXT NOT NULL DEFAULT '',
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kaffee_current_pkey" PRIMARY KEY ("id")
);

-- Seed: Tropical Rainforest ist aktuell drin
INSERT INTO "kaffee_current" ("id", "name", "herkunft", "duftnotizen", "fairtrade", "changedBy", "changedAt", "updatedAt")
VALUES ('singleton', 'Tropical Rainforest', '', '', false, '', NOW(), NOW());
