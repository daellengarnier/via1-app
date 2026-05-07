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
