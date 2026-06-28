-- Aufgabe-Erweiterung fuer Pendenzen (Sitzungs-Workflow):
-- ALLE Spalten sind NULLABLE, bestehende Aufgaben bleiben unangetastet.
--
-- assignedToId        : strukturierter User-Zuweisung (zusaetzlich
--                       zum String-Feld 'assignee')
-- sourceTerminId      : von welcher Sitzung kommt die Pendenz
-- sourceTraktandumId  : aus welchem Traktandum konkret
-- completionNote      : optionaler Erledigungs-Text der beim
--                       Abhaken eingegeben werden kann; wird in
--                       der naechsten Sitzung als Status-Update
--                       angezeigt damit der Protokollant es nicht
--                       doppelt eintragen muss

ALTER TABLE "aufgaben"
  ADD COLUMN "assignedToId"      TEXT,
  ADD COLUMN "sourceTerminId"    TEXT,
  ADD COLUMN "sourceTraktandumId" TEXT,
  ADD COLUMN "completionNote"    TEXT;

CREATE INDEX "aufgaben_assignedToId_idx"  ON "aufgaben"("assignedToId");
CREATE INDEX "aufgaben_sourceTerminId_idx" ON "aufgaben"("sourceTerminId");

ALTER TABLE "aufgaben"
  ADD CONSTRAINT "aufgaben_assignedToId_fkey"
    FOREIGN KEY ("assignedToId")
    REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "aufgaben"
  ADD CONSTRAINT "aufgaben_sourceTerminId_fkey"
    FOREIGN KEY ("sourceTerminId")
    REFERENCES "termine"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "aufgaben"
  ADD CONSTRAINT "aufgaben_sourceTraktandumId_fkey"
    FOREIGN KEY ("sourceTraktandumId")
    REFERENCES "traktanden"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
