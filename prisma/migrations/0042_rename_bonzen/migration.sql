-- Rename "Bonzen" to "Bonzennest" in all DB tables
UPDATE "Wg" SET name = 'Bonzennest' WHERE name = 'Bonzen';
UPDATE putzplan_entries SET wg = 'Bonzennest' WHERE wg = 'Bonzen';
