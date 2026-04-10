-- Add new role values to enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'USER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'GUEST';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'HAUSWART';

-- Rename table to match @@map("users")
ALTER TABLE "User" RENAME TO "users";

-- Add wgId column
ALTER TABLE "users" ADD COLUMN "wgId" TEXT;

-- Add roles array column with default
ALTER TABLE "users" ADD COLUMN "roles" "Role"[] DEFAULT ARRAY['USER']::"Role"[];

-- Migrate existing role data to roles array
UPDATE "users" SET "roles" = ARRAY["role"]::"Role"[];

-- Drop old single role column
ALTER TABLE "users" DROP COLUMN "role";

-- Rename indexes to match new table name
ALTER INDEX "User_pkey" RENAME TO "users_pkey";
ALTER INDEX "User_email_key" RENAME TO "users_email_key";
ALTER INDEX "User_setupToken_key" RENAME TO "users_setupToken_key";
