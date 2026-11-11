-- Sauna: Luftfeuchte zum Messwert (11.11.2026).
-- Der neue Fuehler (Tuya, via Home Assistant) misst Temperatur UND Feuchte an EINER Stelle.
-- "tempBottomC" (zweiter Fuehler unten) wird nicht mehr befuellt und nicht mehr angezeigt.
-- Die Spalte bleibt trotzdem stehen: Loeschen wuerde die alten Messwerte vom ESP32 vernichten
-- und bringt nichts ausser Risiko.
ALTER TABLE "sauna_readings" ADD COLUMN "humidityPct" DECIMAL(5, 2);
