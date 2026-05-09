-- CreateTable
CREATE TABLE "sauna_readings" (
    "id" SERIAL NOT NULL,
    "tempC" DECIMAL(5,2) NOT NULL,
    "rssi" INTEGER,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sauna_readings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sauna_readings_recordedAt_idx" ON "sauna_readings"("recordedAt");
