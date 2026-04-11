-- Add new role values to enum (must be committed before use)
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'USER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'GUEST';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'HAUSWART';
