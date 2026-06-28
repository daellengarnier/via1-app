-- Pendenzen: mehrere User koennen einer Aufgabe zugewiesen werden.
-- Neue M2M-Tabelle ersetzt logisch den single-FK assignedToId, der
-- aber im Schema bleibt (legacy). Alle bestehenden Eintraege werden
-- in der M2M-Tabelle dupliziert, damit keine Zuweisung verloren geht.

CREATE TABLE "_AufgabeAssignees" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AufgabeAssignees_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE INDEX "_AufgabeAssignees_B_index" ON "_AufgabeAssignees"("B");

ALTER TABLE "_AufgabeAssignees" ADD CONSTRAINT "_AufgabeAssignees_A_fkey"
    FOREIGN KEY ("A") REFERENCES "aufgaben"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_AufgabeAssignees" ADD CONSTRAINT "_AufgabeAssignees_B_fkey"
    FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: bestehende single-FK assignedToId in die M2M-Tabelle.
INSERT INTO "_AufgabeAssignees" ("A", "B")
SELECT "id", "assignedToId"
  FROM "aufgaben"
 WHERE "assignedToId" IS NOT NULL
ON CONFLICT DO NOTHING;
