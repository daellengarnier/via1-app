-- Sitzungsprotokolle: zentrale Tabelle fuer alle Haus-Sitzungsprotokolle.
-- Wird automatisch befuellt sobald jemand das PDF einer Haussitzung
-- erstellt. Datum-sortierter Liste-View im Hausbuch.

CREATE TABLE "Sitzungsprotokoll" (
  "id"          TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "date"        TIMESTAMP(3) NOT NULL,
  "wgName"      TEXT,
  "terminId"    TEXT,
  "pdfData"     TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Sitzungsprotokoll_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Sitzungsprotokoll_terminId_fkey"
    FOREIGN KEY ("terminId") REFERENCES "termine"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Sitzungsprotokoll_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Sitzungsprotokoll_date_idx" ON "Sitzungsprotokoll"("date");
CREATE INDEX "Sitzungsprotokoll_terminId_idx" ON "Sitzungsprotokoll"("terminId");
