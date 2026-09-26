-- Einmalige Aufraeumung: Test-Pendenzen aus der Haussitzung 28.06.2026
-- (alle erstellt + erledigt von Daellen waehrend der Testphase).
-- Filter: nur Pendenzen mit sourceTerminId (Sitzungs-Pendenz), erledigt,
-- mit exakt diesen Titeln.
--
-- Best-effort: Diese Migration ist auf dem Server gescheitert und hat
-- damit alle folgenden Migrationen blockiert (Prisma P3009). Ein reines
-- Aufraeumen darf den Deploy nie blockieren — deshalb Fehler abfangen.
-- Die Eintraege koennen jederzeit auch in der App geloescht werden.

DO $$
BEGIN
  DELETE FROM "aufgaben"
  WHERE "sourceTerminId" IS NOT NULL
    AND "done" = TRUE
    AND "title" IN (
      'Macht eine Aufgabe in der App "Platz für Töpfe finden',
      'Macht eine Aufgabe in der App "Platz für Töpfe finden"',
      'Erstellt einen Termin in der App für ein Yoga im Garten',
      'Abrechnung machen und Couvert mit QR-Code in Umlauf geben.',
      'C'
    );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '0095 cleanup skipped: %', SQLERRM;
END $$;
