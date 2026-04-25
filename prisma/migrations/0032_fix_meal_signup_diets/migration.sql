-- Fix existing meal signups: set diet and allergies from user profile
-- (Previously hardcoded to FLEISCH by the client)
UPDATE meal_signups ms
SET diet = u.diet, allergies = COALESCE(u.allergies, '')
FROM users u
WHERE ms."userId" = u.id
  AND ms."goingSelf" = true
  AND u.diet IS NOT NULL;
