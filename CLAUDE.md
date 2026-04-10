# CLAUDE.md - Projektkontext fuer Claude Code

## Projekt

**via1-app** - Web-App zur Organisation einer Hausgemeinschaft. Geteiltes Projekt von Alain und Yves (Brueder, Nachname d'Allengarnier).

Kernmodule: Benutzerverwaltung, Sitzungen/Protokolle/Traktanden, Hauswart-Ticketing, Aufgabenorganisation, Wissensdatenbank, Gamification (Avatare, Punkte etc.).

**Zentrales UI-Konzept:** Interaktives 3D-Modell von Haus und Umgebung. Avatare in Wohnungen sichtbar, Tickets/Aufgaben ortsbezogen als Marker. Bewohner koennen Dinge melden ("hier liegt ein Asthaufen"), andere erledigen sie. Kein Punkte-/Ranglisten-System - eher spassig und spielerisch (z.B. Sauna-Temperatur-Tracking).

## Mitarbeiter

- **Alain** (GitHub: daellengarnier) - Hat den urspruenglichen Prototyp erstellt
- **Yves** (GitHub: yvesgarnier) - Server-Setup, Deployment, Infrastruktur

Alain und Yves sind Brueder. Beide arbeiten via Claude Code am Repository. Diese Datei dient als zentrale Wissensbasis, damit Claude bei jeder Session den aktuellen Stand kennt.

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

## Aktueller Stand

**Alains Prototyp (Vite + React, in Git-History als Commit 193d208):**
Alain hat einen vollstaendigen Prototyp mit Mock-Daten erstellt. Folgende Seiten existierten:
- Dashboard (Uebersicht), 3D-Karte (Three.js in iframe), Termine/Sitzungen mit Traktanden + Protokoll, Aufgaben mit Karten-Pins, Putzplan (WG-Rotation), Sauna (Heiz-Status + Temperatur), Gaestewohnwagen (Buchungssystem), Profil, Login
- Design-System: Dunkles Theme (#0a0a0a), Akzent #b8f068 (Gruen), #ff6b2b (Orange), isometrischer Stil, Space Mono + DM Sans Schriften, Mobile-first

**Migration auf Next.js (aktueller Stand):**
Das Projekt wurde auf Next.js 14+ migriert. Aktuell vorhanden:
- Next.js App-Skeleton mit Prisma, NextAuth, Tailwind
- Erstanmeldungs-Passwort-Setup-Workflow
- Docker + Nginx Deployment-Config
- GitHub Actions Auto-Deploy
- Alains Prototyp-Seiten muessen noch auf Next.js portiert werden (Code in Git-History vorhanden)

## Haus-Kontext

- **Adresse:** Spinnereiweg 17, 3004 Bern (Spinnerei / Via Felsenau)
- **Bewohner:** ca. 25 Personen
- **6 Wohngemeinschaften:**
  - EG Nord: Nordwind
  - EG Ost: Ostblock
  - 1. OG Nord: Dreiecksbar
  - 1. OG Ost: Kleenex
  - 2. OG Nord: Family-WG
  - 2. OG Ost: Bonzen
- **Rollen:** Admin (1 pro WG), Member (Standard-Bewohner)

## Projektstruktur

```
via1-app/
├── .github/workflows/deploy.yml   # Auto-Deploy bei Push auf main
├── docs/server-setup.md           # Server-Einrichtungsanleitung
├── nginx/nginx.conf               # Reverse Proxy Config
├── prisma/
│   ├── schema.prisma              # Datenbankschema
│   └── seed.ts                    # Erstbenutzer (Alain, Yves)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts  # Auth-Endpunkt
│   │   │   └── setup/route.ts               # Passwort-Setup-API
│   │   ├── login/page.tsx         # Login-Seite
│   │   ├── setup/[token]/page.tsx # Erstanmeldungs-Passwort-Setup
│   │   ├── globals.css            # Tailwind Imports
│   │   ├── layout.tsx             # Root Layout
│   │   └── page.tsx               # Startseite
│   ├── lib/
│   │   ├── auth.ts                # NextAuth Konfiguration
│   │   └── prisma.ts              # Prisma Client Singleton
│   └── types/
│       └── next-auth.d.ts         # NextAuth Type Extensions
├── .env.example                   # Environment-Template
├── docker-compose.yml             # Docker Services (db, app, nginx)
├── Dockerfile                     # Multi-stage Next.js Build
├── CLAUDE.md                      # Diese Datei
└── requirements.md                # Anforderungen und Entscheide
```

## Workflow / Zusammenarbeit

Alain und Yves arbeiten beide via Claude Code am Repo. So laeuft die Zusammenarbeit:

### Entwicklungsprozess

1. **Feature-Branches:** Jede Aenderung auf einem eigenen Branch (nie direkt auf `main`)
2. **Aenderungen committen & pushen** auf den eigenen Branch
3. **Wenn fertig:** Claude prueft ob der Branch sauber auf `main` gemerged werden kann

### Merge-Prozess (Aufgabe fuer Claude)

Bevor ein Branch auf `main` gemerged wird, prueft Claude:

1. **Branches vergleichen:** `git diff main...<branch>` - Was hat sich geaendert?
2. **Konflikte pruefen:** Gibt es Merge-Konflikte mit `main`?
3. **Entscheidung:**
   - **Keine Konflikte, sinnvolle Aenderungen:** Direkt mergen auf `main`
   - **Einfache Konflikte** (z.B. verschiedene Stellen geaendert): Claude loest sie selbststaendig und merged
   - **Inhaltliche Konflikte** (z.B. gleiche Stelle anders geaendert, widersprüchliche Entscheide, Architektur-Fragen): **Claude fragt den User** bevor er merged. Nie stillschweigend eine Version bevorzugen!
4. **Nach dem Merge:** CLAUDE.md und requirements.md aktualisieren falls noetig

### Auto-Deploy auf Server

Nach einem Merge auf `main` passiert automatisch:

1. GitHub Actions Workflow wird getriggert (`.github/workflows/deploy.yml`)
2. GitHub verbindet sich via SSH zum Infomaniak VPS
3. Auf dem Server: `git pull origin main` + `docker compose up -d --build`
4. Prisma-Migrationen werden ausgefuehrt
5. Die Aenderungen sind live unter `app.felsenau.org`

**Wichtig:** Weil `main` direkt deployed wird, muss der Code vor dem Merge funktionieren. Kaputte Aenderungen auf `main` = kaputte Live-App.

### Dokumentation als Bruecke

- **CLAUDE.md** und **requirements.md** sind die Bruecke zwischen Alains und Yves' Sessions
- **Changelog in requirements.md** fuehren, damit der andere sieht was sich geaendert hat
- Beide Dateien nach relevanten Aenderungen aktualisieren

### Wichtig fuer Claude

- **Vor jeder Aenderung:** `CLAUDE.md`, `requirements.md` und `ideenliste.md` lesen um den aktuellen Stand zu kennen
- **Bei Fragen zu Ideen/Features:** GitHub Issues im Repo pruefen - Bewohner melden Ideen/Bugs ueber die App, die als Issues landen
- **Nach relevanten Aenderungen:** Dokumentation aktualisieren (CLAUDE.md, requirements.md, ideenliste.md, README.md)
- **Bei Konflikten:** Immer den User fragen, nie stillschweigend eine Version bevorzugen
- **Learnings und Sackgassen** dokumentieren, damit der andere davon profitiert
- **Vor dem Merge auf main:** Pruefen ob der Code sinnvoll ist und keine offensichtlichen Fehler hat

## Konventionen

- Dokumentation in Deutsch (Code und Variablen auf Englisch)
- `CLAUDE.md` ist die zentrale Anlaufstelle fuer Claude Code - hier steht alles, was Claude wissen muss
- `requirements.md` haelt alle Anforderungen, Entscheide und offene Fragen fest
- `ideenliste.md` sammelt Ideen und Einfaelle (locker, unstrukturiert)
- **GitHub Issues** pruefen wenn nach Ideen/Bugs gefragt wird (Issues werden auch ueber die App erstellt)
- Commits: klar und beschreibend, auf Englisch
- Branching: Feature-Branches, kein direkter Push auf `main`
- TypeScript: strikter Modus, kein `any`

## Design-System (von Alains Prototyp)

- Hintergrund: `#0a0a0a` (sehr dunkel)
- Panels: halbtransparent mit Gradient
- Akzent: `#b8f068` (Gruen), Sekundaer: `#ff6b2b` (Orange)
- Isometrische Schatten: `--iso-shadow`, `--iso-shadow-lg`
- Glow-Effekte: `--glow-green`, `--glow-orange`
- Cards: `perspective(800px) rotateX(0.5deg)`, `.card.iso` mit gruenem Border-Left + Glow
- Schriften: Space Mono (mono/labels) + DM Sans (body)
- Mobile-first, max-width 560px

> **TODO:** Design-System auf Tailwind uebertragen.

## Learnings

> Hier werden Erkenntnisse festgehalten, die fuer zukuenftige Sessions relevant sind.

- Alain hat bereits einen funktionierenden Prototyp erstellt bevor Yves dazukam. Immer zuerst `main` pruefen ob schon Code existiert.
- npm-Pfad auf Alains Mac: `/opt/homebrew/bin/npm` (PATH-Issue)
- **PostgreSQL Enum-Werte:** Neue Enum-Werte (`ALTER TYPE ... ADD VALUE`) muessen in einer separaten Migration committed werden, BEVOR sie in Tabellen verwendet werden. Sonst Fehler `55P04 unsafe use of new value`. Also: Migration 1 = Enum erweitern, Migration 2 = Enum verwenden.
- **Docker Build Cache:** `--no-cache` dauert 4-5 Min. Besser: `CACHEBUST` Build-Arg im Dockerfile um nur ab `COPY . .` neu zu bauen.
- **Fehlgeschlagene Prisma-Migration:** Manuell aus `_prisma_migrations` loeschen: `DELETE FROM _prisma_migrations WHERE migration_name = '...';`

## Sackgassen / Was nicht funktioniert hat

> Hier werden Ansaetze dokumentiert, die verworfen wurden - inkl. Grund. Das verhindert, dass wir denselben Fehler zweimal machen.

- **Vite + React Router** als Framework -> Migriert auf Next.js (Full-Stack, API Routes integriert, kein separater Backend-Server noetig)

## Offene Fragen

- ~~Was genau ist der Zweck / die Vision von via1-app?~~ -> Geklaert: Hausgemeinschafts-Organisation
- ~~Welcher Tech Stack soll verwendet werden?~~ -> Geklaert: Next.js + PostgreSQL + Prisma + R3F (siehe Tech Stack)
- ~~Hosting / Deployment - wo soll die App laufen?~~ -> Geklaert: Infomaniak VPS, Docker, app.felsenau.org
- ~~Authentifizierung?~~ -> NextAuth.js, Credentials, Erstanmeldungs-Workflow
- Gibt es bestehende Designs oder Mockups?
- Soll es eine native App geben oder reicht eine responsive Web-App?
- Sollen Bewohner eigene Avatare hochladen oder aus vordefinierten waehlen?
- 3D-Modell: Wer erstellt das Modell? Gibt es Grundrisse/Plaene vom Haus?
- Wie detailliert soll das 3D-Modell sein? (Jedes Zimmer vs. nur Wohnungen/Stockwerke)
- Sauna-Temperatur: Gibt es einen Sensor oder wird manuell eingetragen? (Shelly? MQTT? API?)
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
