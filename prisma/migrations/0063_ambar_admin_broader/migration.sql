-- Ambar zum Admin promoten (breiterer Match: name, fullName oder email).
-- Notwendig damit der "Meine WG"-Tab in der BottomNav angezeigt wird,
-- der per `roles.includes("ADMIN")` gefiltert wird.
--
-- Die fruehere Migration 0059 hat nur `LOWER(name) = 'ambar'` gematcht.
-- Falls Ambar in der DB anders gespeichert ist (z.B. mit Akzent, Vollname,
-- oder anderem Display-Name), wurde sie nicht promotet.

UPDATE "users"
SET "roles" = "roles" || ARRAY['ADMIN']::"Role"[]
WHERE NOT ('ADMIN' = ANY("roles"))
  AND (
       LOWER("name") LIKE '%ambar%'
    OR LOWER(COALESCE("fullName", '')) LIKE '%ambar%'
    OR LOWER("email") LIKE '%ambar%'
  );
