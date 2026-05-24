-- Likes/Anschliessen auf Drohne-Beschwerden
CREATE TABLE "drone_complaint_likes" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drone_complaint_likes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "drone_complaint_likes_complaintId_userId_key"
    ON "drone_complaint_likes"("complaintId", "userId");

CREATE INDEX "drone_complaint_likes_complaintId_idx"
    ON "drone_complaint_likes"("complaintId");

ALTER TABLE "drone_complaint_likes" ADD CONSTRAINT "drone_complaint_likes_complaintId_fkey"
    FOREIGN KEY ("complaintId") REFERENCES "drone_complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "drone_complaint_likes" ADD CONSTRAINT "drone_complaint_likes_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
