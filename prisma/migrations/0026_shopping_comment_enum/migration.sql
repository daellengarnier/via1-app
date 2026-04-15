-- AlterEnum: muss separat committed werden, bevor der Wert verwendet wird
ALTER TYPE "NotificationKind" ADD VALUE IF NOT EXISTS 'SHOPPING_COMMENT';
