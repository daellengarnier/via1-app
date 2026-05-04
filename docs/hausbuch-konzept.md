# Konzept: übersichtliches Hausbuch für Via 1

Stand: 2026-05-04

## Ziel

Das Hausbuch soll nicht wie eine lange Wiki-Liste wirken, sondern wie ein schneller Einstieg ins Hausleben:

- neue Bewohnende finden in 2 Minuten die wichtigsten Infos
- bestehende Bewohnende finden konkrete Anleitungen schnell wieder
- Zuständigkeiten sind sichtbar
- Inhalte aus Notion können sauber übernommen werden
- die Struktur bleibt auch bei vielen Artikeln übersichtlich

## Grundidee

Statt nur „Kategorie + Artikelliste“ bekommt das Hausbuch drei Ebenen:

1. **Start / Überblick** — wenige grosse Bereiche, Suche, wichtige Schnellzugriffe
2. **Themenbereiche** — klar gruppierte Kapitel
3. **Artikel** — kurze, praktische Einträge mit einheitlichem Aufbau

Mobile-first: Auf dem Handy muss alles mit Daumen, Suche und klaren Karten funktionieren.

## Empfohlene Hauptbereiche

### 1. Schnellstart

Für Menschen, die neu sind oder schnell etwas brauchen.

Beispiele:
- Neu im Haus: Was muss ich wissen?
- Notfälle & wichtige Kontakte
- Müll, Recycling, Kompost
- Schlüssel, Türen, Zugang
- WLAN / Technik / Infrastruktur
- Hausregeln kurz

Dieser Bereich sollte auf der Hausbuch-Startseite prominent sein.

### 2. Alltag im Haus

Alles, was regelmässig gebraucht wird.

Beispiele:
- Recycling
- Hauskiosk / Gemeinschaftsladen
- Ämtlis
- Putzplan
- Waschmaschine / Trocknen
- Gäste
- Lärm / Ruhezeiten
- Einkauf / Vorräte

### 3. Räume & Nutzung

Alle Räume und wie man sie nutzt.

Beispiele:
- Gemeinschaftsräume
- Pyramidstage
- Garten
- Biotop
- Werkstatt / Keller / Lager
- Sauna, falls relevant
- Reservationen
- Regeln für Veranstaltungen

### 4. Organisation & Mitwirkung

Wie Via 1 funktioniert.

Beispiele:
- Organisation Via 1
- Wohnbaugenossenschaft Via Felsenau
- Sitzungen
- Entscheidungsfindung
- Arbeitsgruppen
- Abwartsdienst
- Zuständigkeiten
- Protokolle / Ablageorte

### 5. Technik & Infrastruktur

Praktische Anleitungen und technische Zuständigkeiten.

Beispiele:
- Hauptwasserhahn
- Sicherungen / Strom
- Heizung / Lüftung
- Internet / WLAN
- Reparaturen melden
- Geräte-Anleitungen
- Notfallabläufe

### 6. Garten & Umgebung

Alles rund ums Aussenleben.

Beispiele:
- Garten
- Biodiversität
- Biotop
- Kompost
- Werkzeuge
- Spinnerei / Nachbarschaft

### 7. Geschichte & Haltung

Identität und Kultur des Hauses.

Beispiele:
- Haltungspapier
- Geschichte des Hauses
- Architektur des Hauses
- Via-Kultur / Zusammenleben
- Rituale / Traditionen

## Startseite des Hausbuchs

Die aktuelle App hat bereits Suche, Kategorien und aufklappbare Artikel. Für bessere Übersicht würde ich die Startseite so umbauen:

### Oben

- Titel: **Hausbuch**
- kurzer Satz: „Alles Wichtige rund ums Zusammenleben im Via 1.“
- grosse Suche: „Was suchst du?“

### Danach: Schnellzugriffe

4–6 Karten, z.B.:

- 🚨 Notfall & Kontakte
- 🧹 Alltag & Ämtlis
- ♻️ Recycling
- 🏠 Räume nutzen
- 🛠 Reparatur melden
- 🌱 Garten

### Danach: Bereiche

Grosse Kapitelkarten statt vieler kleiner Kategorie-Chips:

- Schnellstart
- Alltag
- Räume
- Organisation
- Technik
- Garten
- Geschichte & Haltung

Jede Karte zeigt:

- Icon
- Bereichsname
- 1 kurze Beschreibung
- Anzahl Artikel

### Danach: Aktuell / wichtig

Optional, aber nützlich:

- „Zuletzt aktualisiert“
- „Wichtige Einträge“
- „Noch unvollständig“

## Artikel-Aufbau

Jeder Artikel sollte möglichst gleich aufgebaut sein:

```md
Kurzfassung
1–3 Sätze: Worum geht es? Was muss ich wissen?

So geht’s
- Schritt 1
- Schritt 2
- Schritt 3

Zuständig
Name / Gruppe / Ämtli

Ort / Material
Wo ist es? Was braucht man?

Wichtig
Warnungen, Regeln, No-Gos

Links / Dokumente
Notion, Drive, Protokolle, externe Links

Aktualität
Zuletzt geprüft am … von …
```

Nicht jeder Artikel braucht alle Felder, aber die Reihenfolge sollte gleich bleiben.

## Inhaltliche Struktur aus dem bestehenden Entwurf

Aktuelle Seed-Einträge können so einsortiert werden:

| bestehender Eintrag | neuer Hauptbereich |
| --- | --- |
| Biodiversität | Garten & Umgebung |
| Spinnerei | Garten & Umgebung / Nachbarschaft |
| Hauskiosk | Alltag im Haus |
| Recycling | Schnellstart + Alltag |
| Haltungspapier | Geschichte & Haltung |
| Geschichte des Hauses | Geschichte & Haltung |
| Architektur des Hauses | Geschichte & Haltung |
| Pyramidstage | Räume & Nutzung |
| Garten | Garten & Umgebung |
| Abwartsdienst | Organisation & Mitwirkung |
| Biotop | Garten & Umgebung |
| Gemeinschaftsladen | Alltag im Haus |
| Wohnbaugenossenschaft Via Felsenau | Organisation & Mitwirkung |
| Organisation Via 1 | Organisation & Mitwirkung |
| Ämtlis | Alltag im Haus |

## Datenmodell: kleine Erweiterung empfohlen

Aktuell hat `HausbuchArticle`:

- title
- content
- category
- owner
- created/updated info

Für ein gutes Handbuch würde ich ergänzen:

- `summary` — Kurzfassung für Karten und Suche
- `section` — Hauptbereich, z.B. Alltag, Technik, Organisation
- `tags` — mehrere Schlagworte, z.B. Müll, Küche, Notfall
- `priority` oder `pinned` — wichtige Einträge oben anzeigen
- `status` — Entwurf / vollständig / muss geprüft werden
- `sortOrder` — Reihenfolge innerhalb eines Bereichs
- optional: `lastReviewedAt` — „zuletzt geprüft“

Wenn es schnell gehen soll, kann man zuerst `category` als Hauptbereich verwenden und später erweitern.

## UI-Konzept für Mobile

### Listenansicht

Artikelkarten sollten zeigen:

- Titel
- Kurzfassung, max. 2 Zeilen
- Bereich/Kategorie
- Owner
- „aktualisiert vor …“

Beim Öffnen nicht nur ein langer Textblock, sondern:

- Kurzfassung oben als hervorgehobene Box
- danach Inhalt mit Abschnitten
- unten Owner/Aktualität/Bearbeiten

### Suche

Suche sollte durchsuchen:

- Titel
- Kurzfassung
- Inhalt
- Tags
- Kategorie/Bereich

Gute Such-Platzhalter:

- „z.B. Müll, WLAN, Hauptwasserhahn, Gäste…“

### Filter

Nicht zu viele Filter gleichzeitig. Besser:

- Hauptbereiche als grosse Karten
- innerhalb eines Bereichs kleine Chips/Tags
- Button „Nur wichtige“
- Button „Unvollständige Artikel“ nur für Admins/Editor:innen

## Import aus Notion

Die Notion-Seite ist vermutlich die Quellstruktur. Da Notion öffentlich oft nur per JavaScript lädt, sollte der Import am besten über einen Export laufen:

1. Notion als Markdown/CSV exportieren
2. Struktur in Hauptbereiche mappen
3. Artikel in ein einheitliches Format bringen
4. in `SEED_ENTRIES` oder direkt per Admin-Import übernehmen

Empfohlenes Mapping-Sheet:

```csv
notion_title,section,category,tags,summary,owner,status,app_title
```

So kann man die vorbereitete Notion-Struktur kontrolliert in die App übernehmen, ohne dass alles ungeordnet als Fliesstext landet.

## MVP-Umsetzung

### Schritt 1: Struktur festlegen

- Hauptbereiche definieren
- bestehende Seed-Einträge einsortieren
- Notion-Inhalte exportieren und mappen

### Schritt 2: Hausbuch-Startseite verbessern

- Suche prominenter
- Schnellzugriffe
- Bereichskarten
- Artikelkarten mit Kurzfassung

### Schritt 3: Inhalte übernehmen

- pro Notion-Seite ein Artikel
- lange Seiten in mehrere praktische Artikel aufteilen
- fehlende Inhalte als „Entwurf“ markieren

### Schritt 4: Pflege erleichtern

- Owner sichtbar
- Status sichtbar
- „zuletzt geprüft“
- Admin-Ansicht für unvollständige Artikel

## Empfehlung

Ich würde nicht versuchen, das Notion 1:1 nachzubauen. Besser:

- Notion bleibt Rohmaterial / Redaktionsstruktur
- die App wird ein praktisches Handbuch für Alltagssituationen
- grosse Themen werden in kleine, findbare Artikel zerlegt
- die Startseite priorisiert Schnellzugriff statt Vollständigkeit

Das macht das Hausbuch viel brauchbarer — besonders auf dem Handy.
