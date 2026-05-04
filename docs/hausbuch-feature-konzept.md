# Hausbuch: Konzept für Anleitungen, Fotos und interne Links

Stand: 2026-05-04

## Ausgangslage

Die App hat bereits ein Hausbuch mit:

- Artikeln (`HausbuchArticle`)
- Titel
- Inhalt als Text
- Kategorie
- Owner
- Ersteller/Aktualisierung
- Suche und Kategorienfilter
- Seed-Struktur

Die Notion-Struktur wurde lokal exportiert:

- `docs/notion-hausbuch-export.md`
- `docs/notion-hausbuch-export-local-assets.md`
- `docs/notion-hausbuch-assets/`
- `docs/notion-hausbuch-recordmap.json`

## Ziel

Bewohnende sollen in der App sehr einfach Hausbuch-Einträge erstellen können — je nach Art des Eintrags:

- normale Info-Seite
- Schritt-für-Schritt-Anleitung
- Checkliste
- Kontakt-/Zuständigkeits-Eintrag
- Raum-/Ort-Eintrag
- Geräte-/Technik-Anleitung
- Regel/Haltung/Organisation

Fotos sollen direkt beim Erstellen/Bearbeiten hinzugefügt werden können.

Einträge sollen aufeinander verlinken können, z.B.:

- „siehe auch: Entsorgung & Recycling“
- „gehört zu: Waschküche“
- „verwandt: Waschbadge“

## Wichtigste UX-Idee

Beim Erstellen fragt die App nicht einfach nur nach „Titel + Text“, sondern zuerst:

**Was möchtest du erstellen?**

Dann bekommt die Person eine passende Vorlage.

## Eintragsarten

### 1. Info-Eintrag

Für allgemeines Wissen.

Felder:

- Titel
- Kurzfassung
- Kategorie / Bereich
- Inhalt
- Fotos optional
- Verantwortliche Person
- Verlinkte Einträge optional

Beispiele:

- Geschichte des Hauses
- Architektur
- Haltungspapier

### 2. Schritt-für-Schritt-Anleitung

Für konkrete Abläufe.

Felder:

- Titel
- Worum geht es?
- Benötigtes Material
- Schritte
  - Schritt-Titel
  - Beschreibung
  - Foto optional pro Schritt
  - Warnhinweis optional
- Häufige Fehler / Tipps
- Zuständig
- Verlinkte Einträge

Beispiele:

- Waschbadge aufladen
- Lüftung im Saal bedienen
- PET entsorgen
- Haupttüre umstellen
- Sauna starten

### 3. Checkliste

Für wiederkehrende Aufgaben.

Felder:

- Titel
- Wann benutzen?
- Checklistenpunkte
- Rhythmus optional
- Zuständig
- Fotos optional

Beispiele:

- Waschküche Monatsreinigung
- Dachterrasse kontrollieren
- Parkplatz von Laub befreien

### 4. Ort/Raum

Für Orte im Haus.

Felder:

- Name des Orts
- Wo ist das?
- Nutzung
- Regeln
- Zuständig
- Fotos
- Zugehörige Anleitungen

Beispiele:

- Waschküche
- Pyramide
- Garten
- Saal / Spinnerei
- Dachterrasse

### 5. Kontakt/Zuständigkeit

Für Rollen und Ansprechpersonen.

Felder:

- Rolle / Thema
- Wer ist zuständig?
- Kontaktweg
- Wann kontaktieren?
- Verlinkte Einträge

Beispiele:

- Abwartsdienst
- Mietwesen
- Gemeinschaftsladen
- Hauswartung

## Datenmodell-Empfehlung

Aktuell ist `content` ein einzelner Text. Für flexible Anleitungen würde ich nicht alles sofort hart normalisieren, sondern eine pragmatische Hybrid-Lösung nehmen:

### Variante empfohlen: strukturierter JSON-Inhalt + Medien + Links

`HausbuchArticle` erweitern:

```prisma
model HausbuchArticle {
  id          String   @id @default(cuid())
  title       String
  summary     String?  // Kurzfassung für Karten/Suche
  content     String   // Fallback / Markdown / plain text
  structured  Json?    // strukturierte Vorlage: steps, checklist, sections
  type        String   @default("INFO") // INFO, GUIDE, CHECKLIST, PLACE, CONTACT
  category    String
  section     String?  // Hauptbereich, z.B. Alltag, Technik
  tags        String[] @default([])
  owner       String
  pinned      Boolean  @default(false)
  status      String   @default("DRAFT") // DRAFT, REVIEW, PUBLISHED
  createdById String?
  updatedById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  images      HausbuchImage[]
  linksFrom   HausbuchArticleLink[] @relation("HausbuchLinksFrom")
  linksTo     HausbuchArticleLink[] @relation("HausbuchLinksTo")
}
```

Neue Tabellen:

```prisma
model HausbuchImage {
  id        String @id @default(cuid())
  articleId String
  article   HausbuchArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)
  data      String // zuerst Data URL wie Flohmi; später Datei/S3 möglich
  caption   String?
  stepId    String? // optional: Bild gehört zu Schritt
  order     Int @default(0)
}

model HausbuchArticleLink {
  id       String @id @default(cuid())
  fromId   String
  toId     String
  label    String?
  from     HausbuchArticle @relation("HausbuchLinksFrom", fields: [fromId], references: [id], onDelete: Cascade)
  to       HausbuchArticle @relation("HausbuchLinksTo", fields: [toId], references: [id], onDelete: Cascade)

  @@unique([fromId, toId])
}
```

Warum so:

- schnell umsetzbar
- bestehende Artikel bleiben kompatibel
- Schritt-für-Schritt ist trotzdem sauber abbildbar
- Fotos können wie beim Flohmi komprimiert und gespeichert werden
- interne Links sind echte Relationen, nicht nur Text

## Strukturierter Inhalt: Beispiel

Für eine Anleitung:

```json
{
  "version": 1,
  "type": "GUIDE",
  "intro": "So stellst du die Türschliessung der Haupteingangstüre um.",
  "materials": ["kleines Schlüsseli"],
  "steps": [
    {
      "id": "step-1",
      "title": "Schlüsseli holen",
      "body": "Das kleine Schlüsseli befindet sich ...",
      "warning": "Nicht mit Gewalt drehen."
    },
    {
      "id": "step-2",
      "title": "Schliessung umstellen",
      "body": "Schlüsseli einsetzen und ..."
    }
  ],
  "tips": ["Nach dem Umstellen prüfen, ob die Tür wirklich schliesst."],
  "relatedArticleIds": []
}
```

## UI fürs Erstellen

### Schritt 1: Typ wählen

Karten:

- 📄 Info
- ✅ Checkliste
- 🧭 Anleitung
- 🏠 Ort/Raum
- 👤 Kontakt/Zuständigkeit

### Schritt 2: Basisdaten

- Titel
- Kurzfassung
- Bereich/Kategorie
- Tags
- Owner

### Schritt 3: Inhalt passend zum Typ

Bei Anleitung:

- „Material hinzufügen“
- „Schritt hinzufügen“
- pro Schritt:
  - Titel
  - Text
  - Foto hinzufügen
  - Warnhinweis optional

Bei Checkliste:

- Checklistenpunkt hinzufügen
- Reihenfolge per hoch/runter oder Drag später

Bei Ort/Raum:

- Standort
- Nutzung
- Regeln
- Fotos
- verknüpfte Anleitungen

### Schritt 4: Verlinkungen

Ein Suchfeld:

„Verwandten Eintrag suchen…“

Ausgewählte Links erscheinen als Chips:

- Waschküche ×
- Waschbadge ×
- Entsorgung & Recycling ×

Optional Label:

- „siehe auch“
- „gehört zu“
- „Anleitung dazu“

## Fotos

Kurzfristig: Gleiches Prinzip wie Flohmi.

- File Input `accept="image/*"`
- Komprimierung via `src/lib/image-compress.ts`
- Speicherung als Data URL in DB
- Limit z.B. 8 Bilder pro Artikel, 1 Bild pro Schritt empfohlen

Mittelfristig besser:

- echte Upload-Dateien in `/public/uploads` oder Object Storage
- DB speichert nur URL/Pfad

Für diese App reicht kurzfristig Data URL, weil es intern und klein bleibt. Aber für viele Hausbuchfotos wird File Storage langfristig sauberer.

## Darstellung eines Artikels

### Anleitung

```text
Titel
Kurzfassung

Material
- ...

Schritte
1. Schritt-Titel
   Text
   Foto
   Warnung, falls vorhanden

Tipps
- ...

Siehe auch
[Waschküche] [Waschbadge]
```

### Ort/Raum

```text
Titel
Kurzfassung

Wo?
...

Nutzung
...

Regeln
...

Anleitungen dazu
[Sauna starten] [Lüftung bedienen]
```

## Notion-Import-Mapping

Die Notion-Struktur enthält bereits brauchbare Kapitel wie:

- Parking
- Zufahrt & Vorplatz
- Eingang / Treppenhaus
- Wohnungen
- Saal / Spinnerei
- Pyramide
- Dach / Terrasse
- Waschküche
- Garten
- Sauna
- Brandschutz
- Elektroinstallation
- Sanitäre Installation
- Heizung
- Gemeinschaft
- Mietwesen
- Genossenschaft
- Entsorgung & Recycling

Import-Regel:

- jede grosse Notion-Seite wird ein Hausbuch-Eintrag vom Typ `PLACE`, `INFO` oder `GUIDE`
- Unterüberschriften mit klaren Abläufen werden später in eigene `GUIDE`-Einträge ausgelagert
- Bilder aus Notion werden übernommen und dem passenden Artikel/Schritt zugeordnet

Beispiel:

- `Eingang / Treppenhaus` → Ort/Raum
- `Feuerwehrschlüssel` → Anleitung oder Info innerhalb Eingang/Treppenhaus
- `Umstellung der Türschliessung` → eigene Schritt-für-Schritt-Anleitung mit Foto
- `Waschküche` → Ort/Raum
- `Waschbadge` → eigene Anleitung

## MVP-Vorschlag

### Phase 1 — ohne riesigen Umbau

- `type`, `summary`, `structured`, `tags`, `pinned`, `status` zu `HausbuchArticle`
- Bilder-Tabelle hinzufügen
- Links-Tabelle hinzufügen
- Create/Edit-Form mit Typ-Auswahl und einfachen Schrittfeldern
- Anzeige für `GUIDE` und `CHECKLIST`

### Phase 2 — Import

- Notion-Markdown in Seed-Daten umwandeln
- grobe Artikel automatisch erstellen
- besonders wichtige Anleitungen manuell verfeinern

### Phase 3 — Komfort

- Drag & Drop für Schritte/Bilder
- Admin-Ansicht „Entwürfe / unvollständig“
- „zuletzt geprüft“
- bessere Volltextsuche über Tags und Summary

## Meine Empfehlung

Für Via 1 würde ich zuerst die **Anleitungs-Erstellung richtig gut machen**, nicht den perfekten Wiki-Editor bauen.

Also:

1. Typ auswählen
2. passende Vorlage ausfüllen
3. Fotos pro Artikel/Schritt hinzufügen
4. verwandte Einträge verlinken
5. Artikel bleibt mobil gut lesbar

Das ist alltagstauglicher als ein freies Markdown-Wiki und verhindert, dass das Hausbuch wieder unübersichtlich wird.
