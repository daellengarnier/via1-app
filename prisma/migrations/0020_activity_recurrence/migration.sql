-- AlterTable
ALTER TABLE "activities" ADD COLUMN "recurrenceGroupId" TEXT;

-- CreateIndex
CREATE INDEX "activities_recurrenceGroupId_idx" ON "activities"("recurrenceGroupId");
