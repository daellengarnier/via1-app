-- DroneFlight + Beschwerden (3-Tap-Drohne-Easter-Egg)
CREATE TABLE "drone_flights" (
    "id" TEXT NOT NULL,
    "startedById" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "drone_flights_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "drone_flights_endedAt_idx" ON "drone_flights"("endedAt");

ALTER TABLE "drone_flights" ADD CONSTRAINT "drone_flights_startedById_fkey"
    FOREIGN KEY ("startedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "drone_complaints" (
    "id" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drone_complaints_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "drone_complaints_flightId_createdAt_idx" ON "drone_complaints"("flightId", "createdAt");

ALTER TABLE "drone_complaints" ADD CONSTRAINT "drone_complaints_flightId_fkey"
    FOREIGN KEY ("flightId") REFERENCES "drone_flights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "drone_complaints" ADD CONSTRAINT "drone_complaints_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
