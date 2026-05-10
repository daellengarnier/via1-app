-- Neuer NotificationKind-Wert muss separat committed werden, BEVOR
-- er in einer Tabelle verwendet wird (Postgres-Restriktion).
ALTER TYPE "NotificationKind" ADD VALUE 'WG_KOCH_NEW';
