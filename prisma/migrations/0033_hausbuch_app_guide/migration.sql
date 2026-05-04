-- Hausbuch-Artikel: App-Anleitung
-- Wird dem ersten Admin-User zugeordnet
INSERT INTO hausbuch_articles (id, title, content, category, owner, "createdById", "updatedById", "createdAt", "updatedAt")
SELECT
  'app-guide-001',
  'Via 1 App — Funktionsübersicht',
  '# Via 1 App

Die Via 1 App organisiert das Zusammenleben im Haus. Hier eine Übersicht aller Funktionen.

---

## 🏠 Home
Das Dashboard zeigt auf einen Blick: nächste Sitzung, offene Aufgaben, Putzplan-Status, Sauna-Temperatur, Wetter & Aare-Temperatur, sowie die Pinnwand.

## 📅 Termine
- **Sitzungen** mit Traktanden, Protokoll, Sitzungsleitung und Anwesenheitsliste
- **Gemeinsames Essen** mit Anmeldung, Gäste mitbringen, Diät-Übersicht (🍖🥗🌱)
- **Sonstige Termine** (Anlässe, Events)
- Kalender-Export (ICS) und Protokoll-Export (PDF)
- Klick auf die Anmeldezahl zeigt alle Details

## ✅ Aufgaben
Offene Aufgaben im Haus — melden, zuweisen, erledigen. Mit Standort-Pin auf der Karte.

## 🧹 Putzplan
WG-Rotation für Treppenhaus & Waschküche. Automatischer Neustart wenn alle durch sind.

## ☕ Kaffee-Abo
- Aktuell eingefüllte Bohnen sehen (mit Duftnoten & Herkunft)
- Bohnen wechseln aus dem Rast-Sortiment oder eigene erfassen
- Etikette fotografieren → App liest Infos automatisch aus
- Monats-Abo wählen und Bezahlung einrichten

## 🛒 Einkauf
Gemeinsame Einkaufsliste — Artikel hinzufügen, abhaken, kommentieren.

## 🎪 Aktivitäten
Gemeinsame Aktivitäten organisieren (Sport, Ausflüge, Kurse). Mit Anmeldung, Kommentaren und wiederkehrenden Terminen.

## 📌 Pinnwand
Schwarzes Brett für kurze Mitteilungen, Ankündigungen und Infos an alle.

## 🏪 Flohmi
Dinge zum Weitergeben oder Verkaufen — mit Fotos, Preis (gratis oder CHF), Kommentaren. "Nehme ich!"-Button zum Reservieren.

## 🧖 Sauna
Heizung starten, aktuelle Temperatur sehen. Simulation: von Aussentemperatur auf 80°C in 30 Minuten. Nacht-Reset.

## 🚐 Gästewohnwagen
Buchungskalender für den Gästewohnwagen. Wer, wann, wie lange.

## 📖 Hausbuch
Wissensdatenbank — alles Wichtige rund ums Haus (Technik, Regeln, Kontakte, Garten, etc.). Jede:r kann Artikel erstellen und bearbeiten.

## 👥 WGs & Bewohnende
Übersicht aller WGs und Zimmer mit den aktuellen Bewohner:innen. Grundriss ansehen, Schäden melden, Untermiete verwalten.

## 🎮 Tetris
Block-Puzzle mit Musik, Highscore-Rangliste (Top 20) und zunehmender Schwierigkeit. Highscore wird oben links angezeigt.

## 👤 Profil
Name, E-Mail, WG, Geburtstag, Essgewohnheiten, Allergien, Lieblingstier (generiert automatisch einen Avatar). Benachrichtigungs-Einstellungen pro Modul.

## 🔔 Benachrichtigungen
Push-Benachrichtigungen für: neue Termine, Aufgaben, Putzplan, Kaffee-Wechsel, Pinnwand, Flohmi, Aktivitäten und mehr. Individuell einstellbar im Profil.

## 💡 Ideen & Bugs melden
Im Hamburger-Menü (☰) → "Idee oder Bug melden". Landet direkt im Projekt.

---

## 📱 App installieren

**iPhone:** Teilen-Symbol (□↑) → "Zum Home-Bildschirm"
**Android:** Drei Punkte (⋮) → "Zum Startbildschirm hinzufügen"

Dann öffnet sich die App ohne Browser-Leiste — wie eine normale App.',
  'Allgemein',
  'Via 1',
  u.id,
  u.id,
  NOW(),
  NOW()
FROM users u
WHERE u.roles @> ARRAY['ADMIN']::"Role"[]
ORDER BY u."createdAt" ASC
LIMIT 1
ON CONFLICT (id) DO NOTHING;
