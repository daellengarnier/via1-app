-- Paola und Miguelito zum Admin promoten, damit sie den
-- "Meine WG"-Tab in der Bottom-Nav sehen (per `adminOnly: true` gefiltert).
--
-- Breiterer Match wie bei Ambar: name, fullName oder email.
-- Idempotent — nur User ohne ADMIN-Rolle werden upgedated.

UPDATE "users"
SET "roles" = "roles" || ARRAY['ADMIN']::"Role"[]
WHERE NOT ('ADMIN' = ANY("roles"))
  AND (
       LOWER("name") LIKE '%paola%'
    OR LOWER(COALESCE("fullName", '')) LIKE '%paola%'
    OR LOWER("email") LIKE '%paola%'
    OR LOWER("name") LIKE '%miguelito%'
    OR LOWER(COALESCE("fullName", '')) LIKE '%miguelito%'
    OR LOWER("email") LIKE '%miguelito%'
    OR LOWER("name") LIKE '%miguel%'
    OR LOWER(COALESCE("fullName", '')) LIKE '%miguel%'
    OR LOWER("email") LIKE '%miguel%'
  );
