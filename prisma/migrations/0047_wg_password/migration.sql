-- AlterTable: WG-Passwort fuer den privaten "Meine WG"-Bereich.
-- Hash via bcrypt, gesetzt von Admin via Admin-UI. Null = noch kein
-- Passwort gesetzt = Bereich nicht entsperrbar.
ALTER TABLE "Wg" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "Wg" ADD COLUMN "passwordSetAt" TIMESTAMP(3);
ALTER TABLE "Wg" ADD COLUMN "passwordSetById" TEXT;

ALTER TABLE "Wg" ADD CONSTRAINT "Wg_passwordSetById_fkey"
  FOREIGN KEY ("passwordSetById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
