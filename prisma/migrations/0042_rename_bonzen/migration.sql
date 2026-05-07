-- Rename "Bonzen" to "Bonzennest" in all DB tables
UPDATE wgs SET name = 'Bonzennest' WHERE name = 'Bonzen';
UPDATE putzplan_entries SET wg = 'Bonzennest' WHERE wg = 'Bonzen';
