# via1-app

Organisations-App fuer die Wohngemeinschaft **Via 1** (Spinnerei / Via Felsenau, Spinnereiweg 17, 3004 Bern).

Eine Web-App fuer ca. 25 Bewohner in 6 Wohngemeinschaften, die das Zusammenleben organisiert und Spass macht.

**Live:** [app.felsenau.org](https://app.felsenau.org)

## Vorhandene Funktionen

- **Dashboard** - Uebersicht: naechste Sitzung, Putzdienst, offene Aufgaben, Sauna-Temperatur, Wohnwagen-Status
- **Termine** - Sitzungsliste mit Filter (Haussitzung, Hausessen, Andere)
- **Aufgaben** - Task-Liste mit Checkboxen, Ort-Referenz, Zuweisungen
- **Sauna** - Temperaturanzeige, Heiz-Toggle, Temperaturverlauf
- **Putzplan** - Monatliche WG-Rotation (6 WGs), Jahresuebersicht
- **Profil** - Benutzerinfo, WG-Uebersicht, Feedback-Link
- **Feedback** - Ideen und Bugs direkt aus der App melden (erstellt GitHub Issues)
- **Authentifizierung** - Login mit E-Mail/Passwort, Erstanmeldungs-Flow mit Setup-Token
- **Rollen-System** - Mehrfach-Rollen pro User: Admin, User, Guest, Hauswart

## Geplante Funktionen

- **3D-Gelaendekarte** - Interaktives 3D-Modell von Haus und Umgebung (React Three Fiber)
- **Hauswart-Ticketing** - Reparaturen melden, Status tracken, ortsbezogen im 3D-Modell
- **Sitzungsdetails** - Traktanden, Protokolle, Anwesenheit, Beschluesse
- **Gaestewohnwagen** - Buchungssystem mit Kalender und Konflikterkennung
- **Wissensdatenbank** - Wiki-Stil Artikel (Muellabfuhr, Hauptwasserhahn etc.)
- **Push-Benachrichtigungen** - Neue Sitzungen, Aufgaben, Sauna-Status
- **Avatare** - Personalisierte Avatare im 3D-Modell sichtbar
- **Sauna-Sensor** - Echtzeit-Temperatur vom Hardware-Sensor

## Tech Stack

| Komponente | Technologie |
|------------|-------------|
| Framework | Next.js 14+ (App Router) |
| Sprache | TypeScript (strikt) |
| Datenbank | PostgreSQL + Prisma ORM |
| 3D | React Three Fiber + drei |
| Auth | NextAuth.js (Credentials) |
| Styling | Tailwind CSS |
| Deployment | Docker + GitHub Actions |
| Server | Infomaniak VPS + Nginx + Let's Encrypt |

## Wohngemeinschaften

| Lage | Name |
|------|------|
| EG Nord | Nordwind |
| EG Ost | Ostblock |
| 1. OG Nord | Dreiecksbar |
| 1. OG Ost | Kleenex |
| 2. OG Nord | Family-WG |
| 2. OG Ost | Bonzen |

## Entwicklung

```bash
# Dependencies installieren
npm install

# Dev-Server starten
npm run dev

# Mit Docker
docker compose up -d
```

Siehe [CLAUDE.md](CLAUDE.md) fuer detaillierten Projektkontext und [docs/server-setup.md](docs/server-setup.md) fuer die Server-Einrichtung.

## Entwickelt von

- **Alain** ([@daellengarnier](https://github.com/daellengarnier))
- **Yves** ([@yvesgarnier](https://github.com/yvesgarnier))
