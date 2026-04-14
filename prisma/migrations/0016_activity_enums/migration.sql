-- AlterEnum: neue NotificationKind-Werte fuer Activities
-- (separate Migration damit die Werte committed sind bevor sie
-- in Code verwendet werden koennen)
ALTER TYPE "NotificationKind" ADD VALUE IF NOT EXISTS 'ACTIVITY_NEW';
ALTER TYPE "NotificationKind" ADD VALUE IF NOT EXISTS 'ACTIVITY_COMMENT';
