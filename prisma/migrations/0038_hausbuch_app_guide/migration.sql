-- Cleanup: alte fehlgeschlagene Migrationen entfernen (falls vorhanden)
DELETE FROM _prisma_migrations WHERE migration_name IN (
  '0033_hausbuch_app_guide',
  '0034_putzplan_db',
  '0035_kaffee_db',
  '0036_feedback_table',
  '0037_rename_bonzen'
);

-- Hausbuch-Artikel: App-Anleitung (safe INSERT with dollar-quoting)
INSERT INTO hausbuch_articles (id, title, content, category, owner, "createdById", "updatedById", "createdAt", "updatedAt")
SELECT
  'app-guide-001',
  'Via 1 App',
  $$Die Via 1 App organisiert das Zusammenleben im Haus — Sitzungen, Essen, Putzplan, Aufgaben, Kaffee-Abo, Flohmarkt, Sauna, Hausbuch und mehr. Alle Details findest du in den einzelnen Modulen.$$,
  'Allgemein',
  'Via 1',
  u.id,
  u.id,
  NOW(),
  NOW()
FROM users u
WHERE u.roles @> ARRAY['ADMIN']::"Role"[]
ORDER BY u."createdAt" ASC
LIMIT 1
ON CONFLICT (id) DO NOTHING;
