# Requirements - via1-app

## Uebersicht

Dieses Dokument haelt alle Anforderungen, Entscheide und den aktuellen Stand des Projekts fest. Es wird laufend aktualisiert.

## Vision / Ziel

Web-App zur Organisation einer Hausgemeinschaft. Zielgruppe: alle Bewohner eines Mehrfamilienhauses. Die App soll das Zusammenleben strukturieren, Aufgaben transparent machen und durch Gamification-Elemente motivierend wirken.

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

- [ ] Aufgaben erfassen und zuweisen
- [ ] Aufgabenstatus tracken (offen, in Arbeit, erledigt)
- [ ] Wiederkehrende Aufgaben (z.B. Treppenhausreinigung, Gartenarbeit)
- [ ] Uebersicht wer was wann gemacht hat

### 4. Hauswart / Ticketing-System

- [ ] Reparatur-Tickets erstellen (mit Beschreibung, Foto, Dringlichkeit)
- [ ] Ticket-Status verfolgen (gemeldet, in Bearbeitung, erledigt)
- [ ] Zustaendigkeiten zuweisen
- [ ] Kommentare / Updates auf Tickets
- [ ] Benachrichtigungen bei Statusaenderungen

### 5. Wissensdatenbank

- [ ] Artikel / Eintraege erfassen (z.B. "Wo ist der Hauptwasserhahn?", "Muellabfuhr-Termine")
- [ ] Kategorien / Tags fuer bessere Organisation
- [ ] Suchfunktion
- [ ] Von allen Bewohnern editierbar (Wiki-Stil)

### 6. Gamification

- [ ] Avatare fuer jeden User
- [ ] Punkte / Belohnungssystem fuer erledigte Aufgaben
- [ ] Evtl. Badges / Achievements
- [ ] Evtl. Leaderboard / Rangliste

> **Hinweis:** Weitere Anforderungen werden laufend ergaenzt.

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

## Priorisierung

> Was kommt als naechstes?

1. Benutzerverwaltung (Grundlage fuer alles andere)
2. Sitzungen / Traktanden / Protokolle (Kernfunktion)
3. Hauswart-Ticketing (hoher praktischer Nutzen)
4. Arbeiten im/ums Haus
5. Wissensdatenbank
6. Gamification (kann schrittweise eingefuehrt werden)

> Priorisierung ist vorlaeufig - wird mit Alain abgestimmt.

## Changelog

| Datum | Aenderung | Wer |
|-------|-----------|-----|
| 2026-04-10 | Initiale Dokumentationsstruktur erstellt | Daniel |
| 2026-04-10 | Erste Anforderungen erfasst (6 Module) | Daniel |
