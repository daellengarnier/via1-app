# Requirements - via1-app

## Uebersicht

Dieses Dokument haelt alle Anforderungen, Entscheide und den aktuellen Stand des Projekts fest. Es wird laufend aktualisiert und ist die Bruecke zwischen Yvess und Alains Sessions.

## Vision / Ziel

Web-App (PWA) zur Organisation der Hausgemeinschaft Via 1 (Spinnerei / Via Felsenau, Spinnereiweg 17, 3004 Bern). Ca. 25 Bewohner in 6 WGs.

Zentrales Konzept: ein **interaktives 3D-Modell** des Hauses und der Umgebung als Hauptinterface. Bewohner-Avatare sind in den Wohnungen sichtbar. Probleme, Aufgaben und Meldungen sind direkt am Ort im Modell verortet. Die App soll sich weniger wie ein Verwaltungstool und mehr wie ein lebendiges, spielerisches Abbild der Hausgemeinschaft anfuehlen.

## Grundlagen

- Typ: PWA (Progressive Web App), installierbar, offline-faehig
- Sprache: Deutsch
- Primaernutzung: Mobile (Smartphone)
- Login: E-Mail + Passwort (Erstanmeldungs-Workflow mit Setup-Token)
- Backend: Next.js API Routes + PostgreSQL
- Bewohnende: ca. 25 Personen
- Zusammenarbeit: GitHub-Repo, gemeinsam via Claude Code entwickelt

## Struktur: 6 Wohngemeinschaften

| Lage | WG-Name |
|------|---------|
| EG Nord | Nordwind |
| EG Ost | Ostblock |
| 1. OG Nord | Dreiecksbar |
| 1. OG Ost | Kleenex |
| 2. OG Nord | Family-WG |
| 2. OG Ost | Bonzen |

Rollen:
- **Admin:** 1 pro WG
- **Member:** Standard-Bewohner, kann WG-Mitglieder verwalten, Sitzungen bearbeiten etc.

## Design

- Dunkel, angelehnt an die bestehende 3D-Karte
- Isometrischer Stil (leichte Perspektive, Schatten, Tiefe)
- Schriften: Space Mono (Labels, Ueberschriften) + DM Sans (Body)
- Akzentfarbe: #b8f068 (Gruen), Sekundaer: #ff6b2b (Orange)
- Mobile-first

## Funktionale Anforderungen

> Status:
> - [ ] Offen
> - [x] Umgesetzt
> - [-] Verworfen (mit Begruendung)

### F1: Dashboard / Uebersicht (Startseite)

- [ ] Reduzierte Gesamtuebersicht auf einen Blick
- [ ] Naechste Sitzung (Datum, Traktanden-Teaser)
- [ ] Aktueller Putzdienst (welche WG ist diesen Monat dran)
- [ ] Offene Aufgaben (kompakt)
- [ ] Sauna-Status (aktuelle Temperatur, ob geheizt wird)
- [ ] Gaestewohnwagen-Status (frei / belegt, naechste Buchung)

### F2: 3D-Gelaendekarte

- [ ] Basierend auf Three.js / React Three Fiber
- [ ] Alle Gebaeude des Gelaendes sichtbar und klickbar
- [ ] Legende unterhalb der Karte (horizontal scrollbar)
- [ ] Touch-Steuerung (drehen, zoomen, verschieben)
- [ ] Referenz fuer Aufgaben-Pins
- [ ] Bewohner-Avatare in ihren jeweiligen Wohnungen sichtbar
- [ ] Tickets/Meldungen als Marker im Modell
- [ ] Aufgaben ortsbezogen anzeigen (z.B. "hier liegt ein Asthaufen")
- [ ] Interaktiv: Orte anklicken um Meldungen zu erstellen
- [ ] Navigation zwischen Innen- und Aussenansicht

### F3: Terminplanung / Haussitzungen

- [ ] Sitzungen ankuendigen (Titel, Datum, Zeit, Ort)
- [ ] Traktandenliste direkt bei der Sitzung erfassen
- [ ] Protokoll in derselben Ansicht schreiben
- [ ] Protokoll-Notizen pro Traktandum
- [ ] Anwesenheit tracken (pro WG)
- [ ] Essen-Anmeldung bei Hausessen (Erwachsene/Kinder/Gaeste)
- [ ] Beschluesse und naechste Schritte festhalten
- [ ] Archiv vergangener Sitzungen
- [ ] Sitzungstypen: Haussitzung, Hausessen, Andere

### F4: To-Do-Liste / Aufgaben

Jeder Bewohner kann melden was er sieht, andere koennen es erledigen.

- [ ] Aufgaben erstellen, zuweisen, abhaken, loeschen
- [ ] Filter: offen / meine / erledigt / alle
- [ ] Karten-Referenz: Pin auf der 3D-Karte setzen
- [ ] Aufgabenstatus tracken (offen, in Arbeit, erledigt)
- [ ] Wiederkehrende Aufgaben

**Beispiele im Haus:**
- Treppenhaus reinigen, Waschkueche reinigen, Trocknungsraum reinigen

**Beispiele ums Haus:**
- Wege vom Laub befreien, Asthaufen entfernen, Baeume zurueckschneiden, Aprikosen pfluecken, Sauna reinigen

### F5: Putzplan

- [ ] 6 WGs in monatlicher Rotation
- [ ] Zustaendigkeit: Treppenhaus + Waschkueche (gehoert zusammen)
- [ ] Automatische Anzeige: "Diesen Monat dran: WG X"
- [ ] Historie + Vorschau kommender Monate

### F6: Hauswart / Ticketing-System

Meldungen direkt aus dem 3D-Modell heraus erstellen.

- [ ] Reparatur-Tickets erstellen (mit Beschreibung, Foto, Dringlichkeit)
- [ ] Tickets im 3D-Modell am betroffenen Ort sichtbar
- [ ] Ticket-Status verfolgen (gemeldet, in Bearbeitung, erledigt)
- [ ] Zustaendigkeiten zuweisen
- [ ] Kommentare / Updates auf Tickets
- [ ] Benachrichtigungen bei Statusaenderungen

### F7: Bewohnenden-Accounts

- [x] Login pro Person (via NextAuth Credentials)
- [x] Erstanmeldungs-Passwort-Setup (Token-Workflow)
- [ ] Zuordnung zu einer der 6 WGs
- [ ] Personalisierte Navigation
- [ ] Avatare fuer jeden User
- [ ] Avatar-Personalisierung

### F8: Sauna

- [ ] Status "Sauna wird geheizt" setzen -> Push-Benachrichtigung an alle
- [ ] Echtzeit-Temperaturanzeige vom Sensor (z.B. "78°C")
- [ ] Integration Temperatur-Sensor (noch zu klaeren: MQTT, API, Shelly)
- [ ] Mini-Widget auf Dashboard
- [ ] Optional: Sauna-Gebaeude auf 3D-Karte zeigt Status

### F9: Gaestewohnwagen - Buchungssystem

- [ ] Kalenderansicht (belegt/frei)
- [ ] Buchung: Gaestename, Datum von/bis, wer einlaedt
- [ ] Konflikterkennung (keine Doppelbuchungen)
- [ ] Optional: Status auf 3D-Karte sichtbar

### F10: Wissensdatenbank

- [ ] Artikel erfassen (z.B. "Wo ist der Hauptwasserhahn?", "Muellabfuhr-Termine")
- [ ] Kategorien / Tags
- [ ] Suchfunktion
- [ ] Von allen Bewohnern editierbar (Wiki-Stil)

### F11: Push-Benachrichtigungen

- [ ] Neue/aktualisierte Sitzungen
- [ ] Neue Aufgaben / Zuweisungen
- [ ] Erinnerungen (z.B. Putzdienst)
- [ ] Sauna wird eingeheizt
- [ ] Gaestewohnwagen-Buchungsbestaetigung

### F12: Gamification / Spass-Faktor

Keine Punkte oder Ranglisten - eher spielerisch und spassig.

- [ ] Avatare im 3D-Modell sichtbar
- [ ] Sauna-Temperatur-Tracking als Fun-Feature
- [ ] Evtl. saisonale Elemente

## Noch offen / Moegliche Erweiterungen

- Schwarzes Brett / Ankuendigungen
- Einkaufsliste
- Raumreservation (z.B. Kulturspinnerei-Saal)
- Chat / Nachrichten
- Dokumentenablage
- Finanzen / Kasse
- Waschmaschinen-Reservation
- Sauna-Reservation (Zeitfenster buchen?)

## Nicht-funktionale Anforderungen

- [ ] PWA (installierbar, offline-faehig)
- [ ] Mobile-first (primaer Smartphone)
- [ ] Einfache, intuitive Bedienung
- [ ] Schnelle Ladezeiten
- [ ] Datenschutz: nur Bewohner haben Zugang

## Architektur-Entscheide

| Datum | Entscheid | Begruendung |
|-------|-----------|-------------|
| 2026-04-10 | CLAUDE.md + requirements.md als zentrale Doku | Bruecke zwischen Yves und Alains Claude-Sessions |
| 2026-04-10 | TypeScript (strikt, kein any) | Typsicherheit, 2-Personen-Zusammenarbeit, Claude arbeitet praeziser |
| 2026-04-10 | Branch-Workflow mit Claude als Merge-Helfer | Feature-Branches, Claude prueft Konflikte, fragt bei Unklarheiten |
| 2026-04-10 | Next.js 14+ (App Router) | Full-Stack, API Routes integriert, kein separater Backend-Server |
| 2026-04-10 | PostgreSQL + Prisma ORM | Typsichere Queries, automatische Migrationen |
| 2026-04-10 | React Three Fiber fuer 3D | Deklaratives 3D in React, passt zu Next.js |
| 2026-04-10 | NextAuth.js fuer Auth | Credentials Provider, Erstanmeldungs-Workflow |
| 2026-04-10 | Tailwind CSS | Schnelles Prototyping, utility-first |
| 2026-04-10 | Docker + Docker Compose auf Infomaniak VPS | Reproduzierbare Umgebung, einfaches Deployment |
| 2026-04-10 | GitHub Actions Auto-Deploy bei Push auf main | Automatisches Deployment, kein manueller Aufwand |
| 2026-04-10 | Migration von Vite auf Next.js | Vite-Prototyp hatte kein Backend; Next.js bietet Full-Stack |

## Priorisierung

> Was kommt als naechstes?

1. Alains Prototyp-Seiten auf Next.js portieren (Code in Git-History)
2. Benutzerverwaltung mit WG-Zuordnung
3. Sitzungen / Traktanden / Protokolle
4. Putzplan
5. Aufgaben mit Karten-Pins
6. Hauswart-Ticketing
7. Sauna + Gaestewohnwagen
8. 3D-Modell (iterativ aufbauen)
9. Wissensdatenbank
10. Push-Benachrichtigungen
11. Gamification / Spass-Faktor

> Priorisierung wird mit Alain abgestimmt.

## Changelog

| Datum | Aenderung | Wer |
|-------|-----------|-----|
| 2026-04-10 | Prototyp erstellt (Vite + React, 10 Seiten, Mock-Daten) | Alain |
| 2026-04-10 | Initiale Dokumentationsstruktur erstellt | Yves |
| 2026-04-10 | Anforderungen erfasst, Vision geschaerft | Yves |
| 2026-04-10 | Tech Stack definiert (Next.js, Prisma, R3F, Docker) | Yves |
| 2026-04-10 | Server-Setup-Anleitung erstellt | Yves |
| 2026-04-10 | App-Skeleton erstellt (Next.js, Auth, Docker, CI/CD) | Yves |
| 2026-04-10 | Migration von Vite auf Next.js auf main | Server-Session |
| 2026-04-10 | CLAUDE.md und requirements.md zusammengefuehrt (Alains + Yvess Kontext) | Yves |
