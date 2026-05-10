-- NotificationKind-Werte separat (Postgres-Restriktion)
ALTER TYPE "NotificationKind" ADD VALUE 'WG_PINNWAND_NEW';
ALTER TYPE "NotificationKind" ADD VALUE 'WG_PINNWAND_COMMENT';
