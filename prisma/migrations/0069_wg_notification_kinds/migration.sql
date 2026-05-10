-- Neue NotificationKind-Werte fuer den "Meine WG"-Bereich:
-- WG_KOCH_COMMENT, WG_AEMTLI_SWAP_REQUEST, WG_AEMTLI_SWAP_DECISION,
-- WG_AEMTLI_DONE, WG_EINKAUF_COMMENT.
--
-- Wichtig: Enum-Werte muessen in einer separaten Migration committed
-- werden, BEVOR sie in Tabellen verwendet werden (Postgres-Limitation,
-- siehe CLAUDE.md Learnings).
ALTER TYPE "NotificationKind" ADD VALUE IF NOT EXISTS 'WG_KOCH_COMMENT';
ALTER TYPE "NotificationKind" ADD VALUE IF NOT EXISTS 'WG_AEMTLI_SWAP_REQUEST';
ALTER TYPE "NotificationKind" ADD VALUE IF NOT EXISTS 'WG_AEMTLI_SWAP_DECISION';
ALTER TYPE "NotificationKind" ADD VALUE IF NOT EXISTS 'WG_AEMTLI_DONE';
ALTER TYPE "NotificationKind" ADD VALUE IF NOT EXISTS 'WG_EINKAUF_COMMENT';
