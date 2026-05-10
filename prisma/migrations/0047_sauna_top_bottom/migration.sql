-- Rename tempC -> tempTopC, add tempBottomC for second sensor
ALTER TABLE "sauna_readings" RENAME COLUMN "tempC" TO "tempTopC";
ALTER TABLE "sauna_readings" ADD COLUMN "tempBottomC" DECIMAL(5, 2);
