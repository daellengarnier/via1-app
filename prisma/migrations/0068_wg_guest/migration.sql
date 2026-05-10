-- Cross-WG-Mitgliedschaft: User die sich via Passwort zu einer fremden
-- WG entlockt haben werden hier persistiert, damit sie auch Push-
-- Notifications dieser WG erhalten (z.B. Ambar zur Family-WG).
CREATE TABLE "WgGuest" (
  "id"        TEXT NOT NULL,
  "wgId"      TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WgGuest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WgGuest_wgId_userId_key" ON "WgGuest"("wgId", "userId");
CREATE INDEX "WgGuest_userId_idx" ON "WgGuest"("userId");

ALTER TABLE "WgGuest" ADD CONSTRAINT "WgGuest_wgId_fkey"
  FOREIGN KEY ("wgId") REFERENCES "Wg"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WgGuest" ADD CONSTRAINT "WgGuest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
