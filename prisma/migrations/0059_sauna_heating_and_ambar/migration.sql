-- 1) Sauna-Heizstatus als Singleton-Tabelle (vorher localStorage,
--    deshalb fuer andere User unsichtbar)
CREATE TABLE "sauna_heating" (
  "id"            TEXT NOT NULL,
  "startedAt"     TIMESTAMP(3) NOT NULL,
  "startedByName" TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sauna_heating_pkey" PRIMARY KEY ("id")
);

-- 2) Ambar zum Admin machen (idempotent: nur wenn noch nicht Admin)
UPDATE "users"
SET "roles" = "roles" || ARRAY['ADMIN']::"Role"[]
WHERE LOWER("name") = 'ambar'
  AND NOT ('ADMIN' = ANY("roles"));
