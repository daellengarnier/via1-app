# CLAUDE.md - Projektkontext fuer Claude Code

## Projekt

**via1-app** - Web-App zur Organisation einer Hausgemeinschaft. Geteiltes Projekt von Daniel und Alain.

Kernmodule: Benutzerverwaltung, Sitzungen/Protokolle/Traktanden, Hauswart-Ticketing, Aufgabenorganisation, Wissensdatenbank, Gamification (Avatare, Punkte etc.).

**Zentrales UI-Konzept:** Interaktives 3D-Modell von Haus und Umgebung. Avatare in Wohnungen sichtbar, Tickets/Aufgaben ortsbezogen als Marker. Bewohner koennen Dinge melden ("hier liegt ein Asthaufen"), andere erledigen sie. Kein Punkte-/Ranglisten-System - eher spassig und spielerisch (z.B. Sauna-Temperatur-Tracking).

## Mitarbeiter

- **Daniel** (daellengarnier)
- **Alain**

Beide arbeiten via Claude Code am Repository. Diese Datei dient als zentrale Wissensbasis, damit Claude bei jeder Session den aktuellen Stand kennt.

## Tech Stack

> TODO: Ergaenzen sobald Tech-Entscheide gefallen sind.

## Projektstruktur

> TODO: Ergaenzen sobald die erste Struktur steht.

## Konventionen

- Dokumentation in Deutsch (Code und Variablen auf Englisch)
- `CLAUDE.md` ist die zentrale Anlaufstelle fuer Claude Code - hier steht alles, was Claude wissen muss
- `requirements.md` haelt alle Anforderungen, Entscheide und offene Fragen fest
- Commits: klar und beschreibend, auf Englisch
- Branching: Feature-Branches, kein direkter Push auf `main`

## Learnings

> Hier werden Erkenntnisse festgehalten, die fuer zukuenftige Sessions relevant sind.

_(noch keine Eintraege)_

## Sackgassen / Was nicht funktioniert hat

> Hier werden Ansaetze dokumentiert, die verworfen wurden - inkl. Grund. Das verhindert, dass wir denselben Fehler zweimal machen.

_(noch keine Eintraege)_

## Offene Fragen

- ~~Was genau ist der Zweck / die Vision von via1-app?~~ -> Geklaert: Hausgemeinschafts-Organisation
- Welcher Tech Stack soll verwendet werden?
- Gibt es bestehende Designs oder Mockups?
- Hosting / Deployment - wo soll die App laufen?
- Wie viele Bewohner sind es ungefaehr? (relevant fuer Skalierung)
- Soll es eine native App geben oder reicht eine responsive Web-App?
- Authentifizierung: Email/Passwort? OAuth? Einladungslinks?
- Sollen Bewohner eigene Avatare hochladen oder aus vordefinierten waehlen?
- 3D-Modell: Wer erstellt das Modell? Gibt es Grundrisse/Plaene vom Haus?
- 3D-Technologie: Three.js? WebGL? Fertige Engine?
- Wie detailliert soll das 3D-Modell sein? (Jedes Zimmer vs. nur Wohnungen/Stockwerke)
- Sauna-Temperatur: Gibt es einen Sensor oder wird manuell eingetragen?

## Wichtige Befehle

> TODO: Build-, Test- und Lint-Befehle hier eintragen sobald vorhanden.
