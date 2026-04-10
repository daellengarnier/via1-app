# Via1 App – Anforderungen

## GRUNDLAGEN

- Typ: PWA (Progressive Web App), installierbar, offline-fähig
- Sprache: nur Deutsch
- Primärnutzung: Mobile (Smartphone)
- Login: E-Mail + Passwort
- Backend: noch offen (Supabase oder eigener Server)
- Bewohnende: ca. 25 Personen
- Zusammenarbeit: GitHub-Repo, gemeinsam entwickelt

## STRUKTUR: 6 WOHNGEMEINSCHAFTEN

- EG Nord → Nordwind
- EG Ost → Ostblock
- 1. OG Nord → Dreiecksbar
- 1. OG Ost → Kleenex
- 2. OG Nord → Family-WG
- 2. OG Ost → Bonzen

## ROLLEN

- Admin: 1 pro WG
- Member: Standard-Bewohner:in, WG-Mitglieder verwalten, Sitzungen bearbeiten/löschen etc.

## DESIGN

- Dunkel, angelehnt an die bestehende 3D-Karte
- Isometrischer Stil (leichte Perspektive, Schatten, Tiefe)
- Schriften: Space Mono (Labels, Überschriften) + DM Sans (Body)
- Akzentfarbe: #b8f068 (Grün)
- Mobile-first

## FUNKTION 1: DASHBOARD / ÜBERSICHT (STARTSEITE)

- Reduzierte Gesamtübersicht auf einen Blick
- Nächste Sitzung (Datum, Traktanden-Teaser)
- Aktueller Putzdienst (welche WG ist diesen Monat dran)
- Offene Aufgaben (kompakt)
- Sauna-Status (aktuelle Temperatur, ob geheizt wird)
- Gästewohnwagen-Status (frei / belegt, nächste Buchung)

## FUNKTION 2: 3D-GELÄNDEKARTE

- Basierend auf bestehender spinnerei_3d_map.html (Three.js)
- Alle Gebäude des Geländes sichtbar und klickbar
- Legende unterhalb der Karte (horizontal scrollbar)
- Touch-Steuerung (drehen, zoomen, verschieben)
- Dient als Referenz für Aufgaben-Pins

## FUNKTION 3: TERMINPLANUNG / HAUSSITZUNGEN

- Sitzungen ankündigen (Titel, Datum, Zeit, Ort)
- Traktandenliste direkt bei der Sitzung erfassen (hinzufügen, entfernen)
- Protokoll in derselben Ansicht schreiben
- Alles zentral pro Sitzung gebündelt

## FUNKTION 4: TO-DO-LISTE (AUFGABEN)

- Aufgaben erstellen, zuweisen, abhaken, löschen
- Filter: offen / meine / erledigt / alle
- Karten-Referenz: Pin auf der 3D-Karte setzen, um den Ort der Aufgabe zu markieren (z.B. Gartenarbeit an Stelle X)

## FUNKTION 5: PUTZPLAN

- 6 WGs in monatlicher Rotation
- Zuständigkeit für Treppenhaus + Waschküche (gehört zusammen)
- Automatische Anzeige: „Diesen Monat dran: WG X"
- Historie + Vorschau kommender Monate

## FUNKTION 6: BEWOHNENDEN-ACCOUNTS

- Login pro Person (E-Mail + Passwort)
- Zuordnung zu einer der 6 WGs
- Personalisierte Navigation

## FUNKTION 7: PUSH-BENACHRICHTIGUNGEN

- Für neue/aktualisierte Sitzungen
- Neue Aufgaben / Zuweisungen
- Erinnerungen (z.B. Putzdienst)
- Sauna wird eingeheizt
- Gästewohnwagen-Buchungsbestätigung

## FUNKTION 8: SAUNA

- Status "Sauna wird geheizt" setzen → löst Push-Benachrichtigung an alle aus
- Echtzeit-Temperaturanzeige vom Temperatursensor (z.B. "78°C")
- Integration des bestehenden Temperatur-Sensors (Anbindung noch zu klären: MQTT, API, Shelly, etc.)
- Anzeige auf Dashboard als Mini-Widget und optional beim Sauna-Gebäude auf der 3D-Karte

## FUNKTION 9: GÄSTEWOHNWAGEN – BUCHUNGSSYSTEM

- Kalenderansicht mit belegten und freien Tagen
- Buchung erstellen: Gästename, Datum von/bis, wer einlädt (Bewohner:in)
- Übersicht: wann ist der Wohnwagen belegt, wann frei
- Konflikterkennung: keine Doppelbuchungen möglich
- Optional: Verknüpfung mit Gästewohnwagen auf der 3D-Karte (Status frei/belegt sichtbar)

## NOCH OFFEN / MÖGLICHE ERWEITERUNGEN

- Schwarzes Brett / Ankündigungen
- Einkaufsliste
- Raumreservation (z.B. Kulturspinnerei-Saal)
- Chat / Nachrichten
- Dokumentenablage
- Finanzen / Kasse
- Waschmaschinen-Reservation (separat vom Putzplan?)
- Sauna-Reservation (Zeitfenster buchen?)
