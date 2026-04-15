-- AlterEnum: neue NotificationKind-Werte
-- Muessen separat committed werden, bevor sie verwendet werden (Postgres 55P04)
ALTER TYPE "NotificationKind" ADD VALUE IF NOT EXISTS 'FLOHMI_TAKEN';
ALTER TYPE "NotificationKind" ADD VALUE IF NOT EXISTS 'PINNWAND_COMMENT';
