-- Drohnen-Notification: wenn Livio (Stussi) oder Johann (Nachbar)
-- die Drohne via Pyramid-Easter-Egg starten, kriegen alle anderen
-- User eine Push-Notification.
--
-- WICHTIG: ALTER TYPE ADD VALUE darf nicht in derselben Transaktion
-- mit Statements stehen die den Wert benutzen. Hier benutzen wir den
-- Wert nicht direkt — die Insert mit kind='DROHNE_AKTIV' passiert
-- erst zur Laufzeit via notify(). Daher ok in einer Migration.

ALTER TYPE "NotificationKind" ADD VALUE IF NOT EXISTS 'DROHNE_AKTIV';

ALTER TABLE "users"
  ADD COLUMN "notifyDrohne" BOOLEAN NOT NULL DEFAULT true;
