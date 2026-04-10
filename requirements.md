# Requirements - via1-app

## Uebersicht

Dieses Dokument haelt alle Anforderungen, Entscheide und den aktuellen Stand des Projekts fest. Es wird laufend aktualisiert.

## Vision / Ziel

Web-App zur Organisation einer Hausgemeinschaft. Zielgruppe: alle Bewohner eines Mehrfamilienhauses. Die App soll das Zusammenleben strukturieren, Aufgaben transparent machen und Spass machen.

Zentrales Konzept: ein **interaktives 3D-Modell** des Hauses und der Umgebung als Hauptinterface. Bewohner-Avatare sind in den Wohnungen sichtbar. Probleme, Aufgaben und Meldungen sind direkt am Ort im Modell verortet. Die App soll sich weniger wie ein Verwaltungstool und mehr wie ein lebendiges, spielerisches Abbild der Hausgemeinschaft anfuehlen.

## Funktionale Anforderungen

> Anforderungen werden mit Status gekennzeichnet:
> - [ ] Offen
> - [x] Umgesetzt
> - [-] Verworfen (mit Begruendung)

### 1. Benutzerverwaltung

- [ ] Jeder Bewohner hat einen eigenen User-Account
- [ ] Registrierung / Login
- [ ] Benutzerprofil mit Avatar (Gamification)
- [ ] Rollensystem (z.B. Admin, Bewohner, Hauswart)

### 2. Sitzungen / Versammlungen

- [ ] Sitzungen planen und terminieren
- [ ] Traktanden (Agendapunkte) erfassen und verwalten
- [ ] Sitzungsprotokolle erstellen und festhalten
- [ ] Einladungen / Benachrichtigungen an Bewohner
- [ ] Archiv vergangener Sitzungen mit Protokollen

### 3. Arbeiten im und ums Haus

Aufgaben rund um Haus und Umgebung. Jeder Bewohner kann Aufgaben melden, andere koennen sie erledigen.

**Im Haus:**
- [ ] Treppenhaus reinigen
- [ ] Waschkueche reinigen
- [ ] Trocknungsraum reinigen
- [ ] Allgemeine Instandhaltungsaufgaben

**Ums Haus / Umgebung:**
- [ ] Wege vom Laub befreien
- [ ] Asthaufen entfernen (mit Hinweis wohin)
- [ ] Baeume zurueckschneiden
- [ ] Aprikosen pfluecken
- [ ] Sauna reinigen
- [ ] Allgemeine Gartenarbeit

**Allgemein:**
- [ ] Aufgaben erfassen - jeder kann melden was er sieht
- [ ] Andere koennen gemeldete Aufgaben uebernehmen/erledigen
- [ ] Aufgabenstatus tracken (offen, in Arbeit, erledigt)
- [ ] Wiederkehrende Aufgaben (z.B. woechentliche Reinigung)
- [ ] Uebersicht wer was wann gemacht hat
- [ ] Aufgaben im 3D-Modell ortsbezogen anzeigen

### 4. Hauswart / Ticketing-System

Meldungen direkt aus dem 3D-Modell heraus erstellen - z.B. "Wohnung 2. OG Ost: Herd defekt" durch Klick auf die entsprechende Wohnung.

- [ ] Reparatur-Tickets erstellen (mit Beschreibung, Foto, Dringlichkeit)
- [ ] Tickets sind im 3D-Modell am betroffenen Ort sichtbar
- [ ] Ticket-Status verfolgen (gemeldet, in Bearbeitung, erledigt)
- [ ] Zustaendigkeiten zuweisen
- [ ] Kommentare / Updates auf Tickets
- [ ] Benachrichtigungen bei Statusaenderungen

### 5. Wissensdatenbank

- [ ] Artikel / Eintraege erfassen (z.B. "Wo ist der Hauptwasserhahn?", "Muellabfuhr-Termine")
- [ ] Kategorien / Tags fuer bessere Organisation
- [ ] Suchfunktion
- [ ] Von allen Bewohnern editierbar (Wiki-Stil)

### 6. 3D-Modell / Interaktive Karte

Herzstrueck der App: ein 3D-Modell von Haus und Umgebung als zentrales Interface.

- [ ] 3D-Modell des Hauses (Innenansicht mit Wohnungen, Stockwerken)
- [ ] 3D-Modell der Umgebung (Garten, Wege, Baeume, Sauna etc.)
- [ ] Bewohner-Avatare in ihren jeweiligen Wohnungen sichtbar
- [ ] Tickets/Meldungen als Marker im Modell (z.B. defekter Herd in Whg 2. OG Ost)
- [ ] Aufgaben ortsbezogen anzeigen (z.B. "hier liegt ein Asthaufen")
- [ ] Interaktiv: Orte anklicken um Meldungen zu erstellen oder Details zu sehen
- [ ] Navigation zwischen Innen- und Aussenansicht

### 7. Gamification / Spass-Faktor

Keine Punkte oder Ranglisten - eher spielerisch und spassig.

- [ ] Avatare fuer jeden User (im 3D-Modell sichtbar)
- [ ] Avatar-Personalisierung
- [ ] Lustige Features wie Sauna-Temperatur-Tracking
- [ ] Evtl. saisonale Elemente (Schneee im Winter etc.)

> **Hinweis:** Weitere Anforderungen werden laufend ergaenzt. Der Spass-Faktor soll organisch wachsen - keine erzwungene Gamification.

## Nicht-funktionale Anforderungen

- [ ] Web-App (responsive, mobile-friendly)
- [ ] Einfache, intuitive Bedienung (nicht-technische Bewohner muessen damit klarkommen)
- [ ] Schnelle Ladezeiten
- [ ] Datenschutz: nur Bewohner haben Zugang
- [ ] Mehrsprachigkeit? (TODO: klaeren)

## Architektur-Entscheide

> Jeder groessere Entscheid wird hier mit Datum und Begruendung festgehalten.

| Datum | Entscheid | Begruendung |
|-------|-----------|-------------|
| 2026-04-10 | CLAUDE.md + requirements.md als zentrale Doku | Ermoeglicht effektive Zusammenarbeit via Claude Code zwischen Daniel und Alain |
| 2026-04-10 | TypeScript als Sprache | Typsicherheit bei 2-Personen-Zusammenarbeit, komplexe Datenstrukturen (3D etc.), TS-first Oekosystem, Claude arbeitet praeziser damit |
| 2026-04-10 | Branch-basierter Workflow mit Claude als Merge-Helfer | Daniel und Alain arbeiten auf Feature-Branches, Claude prueft Konflikte und fragt bei Unklarheiten nach |

## Priorisierung

> Was kommt als naechstes?

1. Benutzerverwaltung (Grundlage fuer alles andere)
2. Sitzungen / Traktanden / Protokolle (Kernfunktion)
3. Hauswart-Ticketing (hoher praktischer Nutzen)
4. Arbeiten im/ums Haus (Melde- und Erledigungssystem)
5. Wissensdatenbank
6. 3D-Modell (zentrales UI - kann iterativ aufgebaut werden)
7. Gamification / Spass-Faktor (schrittweise, kein Zwang)

> Priorisierung ist vorlaeufig - wird mit Alain abgestimmt.

## Changelog

| Datum | Aenderung | Wer |
|-------|-----------|-----|
| 2026-04-10 | Initiale Dokumentationsstruktur erstellt | Daniel |
| 2026-04-10 | Erste Anforderungen erfasst (6 Module) | Daniel |
| 2026-04-10 | Vision geschaerft: 3D-Modell als zentrales UI, Spass statt Punkte, Melde-System fuer Aufgaben | Daniel |
| 2026-04-10 | TypeScript als Sprache, Workflow fuer Zusammenarbeit definiert | Daniel |
