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

- **Sprache:** TypeScript (strikt, kein `any`)
- **Framework:** Next.js 14+ (App Router)
- **Datenbank:** PostgreSQL + Prisma ORM
- **3D:** Three.js via React Three Fiber (@react-three/fiber) + @react-three/drei
- **Auth:** NextAuth.js (Auth.js) - Credentials Provider mit Erstanmeldungs-Passwort-Setup
- **Styling:** Tailwind CSS
- **Deployment:** Docker + Docker Compose auf Infomaniak VPS
- **CI/CD:** GitHub Actions -> Auto-Deploy via SSH auf VPS bei Push auf `main`
- **Domain:** app.felsenau.org
- **Reverse Proxy:** Nginx mit SSL (Let's Encrypt)

> **Warum diese Wahl?**
> - Next.js: Full-Stack (Frontend + API Routes), kein separater Backend-Server noetig
> - PostgreSQL + Prisma: Typsichere DB-Queries, automatische Migrationen, bewaehrt und robust
> - React Three Fiber: 3D deklarativ in React schreiben (passt zu Next.js), riesiges Oekosystem
> - Docker: Reproduzierbare Umgebung, einfaches Deployment, isolierte Services
> - Tailwind: Schnelles UI-Styling, gut fuer Prototyping

## Projektstruktur

> TODO: Ergaenzen sobald die erste Struktur steht.

## Workflow / Zusammenarbeit

Daniel und Alain arbeiten beide via Claude Code am Repo. So laeuft die Zusammenarbeit:

1. **Feature-Branches:** Jede Aenderung auf einem eigenen Branch (nie direkt auf `main`)
2. **Aenderungen committen & pushen** auf den eigenen Branch
3. **Pull Request erstellen** wenn der Branch fertig ist
4. **Claude prueft beim Merge auf Konflikte:**
   - Keine Konflikte: Merge durchfuehren
   - Einfache Konflikte (z.B. beide haben verschiedene Stellen geaendert): Claude loest sie
   - Inhaltliche Konflikte (z.B. widersprüchliche Entscheide, gleiche Stelle anders geaendert): Claude fragt nach bevor er merged
5. **CLAUDE.md und requirements.md** immer aktuell halten - das ist die Bruecke zwischen den Sessions von Daniel und Alain
6. **Changelog in requirements.md** fuehren, damit der andere sieht was sich geaendert hat

### Wichtig fuer Claude

- Vor jeder Aenderung: `CLAUDE.md` und `requirements.md` lesen um den aktuellen Stand zu kennen
- Nach relevanten Aenderungen: beide Dateien aktualisieren
- Bei Konflikten zwischen Daniel und Alains Aenderungen: **immer fragen**, nie stillschweigend eine Version bevorzugen
- Learnings und Sackgassen dokumentieren, damit der andere davon profitiert

## Konventionen

- Dokumentation in Deutsch (Code und Variablen auf Englisch)
- `CLAUDE.md` ist die zentrale Anlaufstelle fuer Claude Code - hier steht alles, was Claude wissen muss
- `requirements.md` haelt alle Anforderungen, Entscheide und offene Fragen fest
- Commits: klar und beschreibend, auf Englisch
- Branching: Feature-Branches, kein direkter Push auf `main`
- TypeScript: strikter Modus, kein `any`

## Learnings

> Hier werden Erkenntnisse festgehalten, die fuer zukuenftige Sessions relevant sind.

_(noch keine Eintraege)_

## Sackgassen / Was nicht funktioniert hat

> Hier werden Ansaetze dokumentiert, die verworfen wurden - inkl. Grund. Das verhindert, dass wir denselben Fehler zweimal machen.

_(noch keine Eintraege)_

## Offene Fragen

- ~~Was genau ist der Zweck / die Vision von via1-app?~~ -> Geklaert: Hausgemeinschafts-Organisation
- ~~Welcher Tech Stack soll verwendet werden?~~ -> Geklaert: Next.js + PostgreSQL + Prisma + R3F (siehe Tech Stack)
- ~~Hosting / Deployment - wo soll die App laufen?~~ -> Geklaert: Infomaniak VPS, Docker, app.felsenau.org
- ~~Authentifizierung?~~ -> NextAuth.js, Credentials, Erstanmeldungs-Workflow
- Gibt es bestehende Designs oder Mockups?
- Wie viele Bewohner sind es ungefaehr? (relevant fuer Skalierung)
- Soll es eine native App geben oder reicht eine responsive Web-App?
- Sollen Bewohner eigene Avatare hochladen oder aus vordefinierten waehlen?
- 3D-Modell: Wer erstellt das Modell? Gibt es Grundrisse/Plaene vom Haus?
- Wie detailliert soll das 3D-Modell sein? (Jedes Zimmer vs. nur Wohnungen/Stockwerke)
- Sauna-Temperatur: Gibt es einen Sensor oder wird manuell eingetragen?
- App-Name: Noch nicht definiert (Domain ist app.felsenau.org)

## Deployment

- **VPS:** Infomaniak VPS, Zugang via SSH (Server stellt SSH-Key)
- **Domain:** app.felsenau.org
- **Auto-Deploy:** GitHub Actions Workflow, triggered bei Push auf `main`
- **Ablauf:** Claude merged PR auf `main` -> GitHub Action baut Docker Image -> Deploy via SSH auf VPS
- **Rollback:** Vorheriges Docker Image taggen, bei Problemen darauf zurueckswitchen (dokumentiert in `docs/server-setup.md`)

### Erstbenutzer

Beim ersten Setup werden 2 User angelegt:
- **Alain** 
- **Yves**

Beide muessen bei Erstanmeldung ein Passwort setzen (Einladungs-/Setup-Token-Workflow).

## Wichtige Befehle

```bash
# Lokal entwickeln
npm run dev              # Next.js Dev-Server (http://localhost:3000)
npm run build            # Production Build
npm run lint             # ESLint
npx prisma migrate dev   # DB-Migration ausfuehren
npx prisma studio        # DB-GUI

# Docker (lokal oder Server)
docker compose up -d     # Alle Services starten
docker compose down      # Alle Services stoppen
docker compose logs -f   # Logs anzeigen
docker compose up -d --build  # Rebuild und starten
```
