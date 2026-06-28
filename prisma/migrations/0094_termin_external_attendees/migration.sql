-- Externe Sitzungsteilnehmende — Personen die nicht in der App
-- registriert sind. Wird als String-Array auf dem Termin gepflegt.

ALTER TABLE "termine"
  ADD COLUMN "externalAttendees" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
