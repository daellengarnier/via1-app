-- Termin.editors: M2M Termin <-> User (zusaetzliche Bearbeiter neben
-- dem creator). Prisma's implicit M2M-Tabelle heisst "_TerminEditor".
-- ADDITIV: bestehende Termine + Traktanden bleiben unangetastet,
-- nur eine neue Verknuepfungs-Tabelle wird angelegt.

CREATE TABLE "_TerminEditor" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TerminEditor_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE INDEX "_TerminEditor_B_index" ON "_TerminEditor"("B");

ALTER TABLE "_TerminEditor" ADD CONSTRAINT "_TerminEditor_A_fkey"
    FOREIGN KEY ("A") REFERENCES "termine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_TerminEditor" ADD CONSTRAINT "_TerminEditor_B_fkey"
    FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
