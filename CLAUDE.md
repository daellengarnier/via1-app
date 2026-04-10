# Via1 App

Organisations-PWA für die Wohngemeinschaft Via 1 (Spinnerei / Via Felsenau, Spinnereiweg 17, 3004 Bern).
Entwickelt von Alain Garnier und seinem Bruder.

## Stack

- **Framework:** Vite + React 18 + TypeScript
- **Routing:** React Router v6
- **Styling:** Eigenes CSS (`src/styles.css`), kein Tailwind. Design-Tokens als CSS Custom Properties.
- **State:** React Context (`src/store.tsx`) mit localStorage-Persistenz (Key: `via1-store-v6`). Mock-Daten für Prototyp.
- **3D-Karte:** `public/map.html` — standalone Three.js (orthographische Kamera, isometrisch), eingebettet als iframe. Kommunikation via `postMessage` (Pins senden, Legende empfangen).
- **Dev-Server:** `npm run dev` → Vite auf Port 5173

## Seiten & Routing

| Route | Datei | Beschreibung |
|---|---|---|
| `/` | `Dashboard.tsx` | Übersicht: nächster Termin, Sauna-Widget, Wohnwagen-Widget, Putzdienst, eigene Todos |
| `/karte` | `Karte.tsx` | 3D-Karte (iframe), Legende, Todos mit Pins, Putzplan-Vorschau |
| `/termine` | `Sitzungen.tsx` | Terminliste: Haussitzungen, Hausessen, andere Termine |
| `/termine/:id` | `SitzungDetail.tsx` | Traktanden, Protokoll (pro Traktandum), Anwesenheit (pro WG), Essen-Anmeldung, Beschlüsse |
| `/aufgaben` | `Aufgaben.tsx` | To-Do-Liste mit Filter und Karten-Pins |
| `/putzplan` | `Putzplan.tsx` | Monatliche WG-Rotation, Treppenhaus + Waschküche |
| `/sauna` | `Sauna.tsx` | Sauna einheizen, Temperaturanzeige, Status |
| `/wohnwagen` | `Wohnwagen.tsx` | Gästewohnwagen-Buchungssystem, Kalender |
| `/profil` | `Profil.tsx` | Account, WG-Mitglieder, Logout, Demo-Reset |
| `/login` | `Login.tsx` | E-Mail + Passwort (Demo: beliebige @via1.ch / via1) |

## Navigation (Bottom Nav)

Home · Karte · Termine · Sauna · Gäste

(Aufgaben und Putzplan sind in die Karte-Seite integriert. Profil über Topbar-Link.)

## Datenmodell (store.tsx)

- **User:** id, name, email, password, wgId, role (admin/member), color
- **WG:** id, name, floor
- **Sitzung:** Termine mit Typ (haussitzung/hausessen/andere), Traktanden, Protokoll-Notizen pro Traktandum, Anwesenheit, Essen-Anmeldung (Erwachsene/Kinder/Gäste), Beschlüsse, nächste Schritte
- **Aufgabe:** Titel, Beschreibung, Zuweisung, Pin (x/z-Koordinaten auf Karte)
- **PutzAssignment:** Monat → WG
- **SaunaState:** heating, temperature, startedBy, startedAt
- **WohnwagenBooking:** Gästename, von/bis, eingeladen von

## Design-System

- Hintergrund: `#0a0a0a` (sehr dunkel)
- Panels: halbtransparent mit Gradient
- Akzent: `#b8f068` (Grün), Sekundär: `#ff6b2b` (Orange)
- Isometrische Schatten: `--iso-shadow`, `--iso-shadow-lg`
- Glow-Effekte: `--glow-green`, `--glow-orange`
- Cards: `perspective(800px) rotateX(0.5deg)`, `.card.iso` mit grünem Border-Left + Glow
- Schriften: Space Mono (mono/labels) + DM Sans (body)
- Mobile-first, max-width 560px

## Konventionen

- Sprache der App: Deutsch
- Sprache im Code (Variablen, Kommentare): Englisch
- Store-Key versionieren (`via1-store-vN`) wenn sich Seed-Daten ändern
- npm: `/opt/homebrew/bin/npm` (PATH-Issue auf Alains Mac)

## Offene technische Entscheidungen

- Backend: Supabase vs. eigener Server
- Sauna-Sensor: Anbindung klären (MQTT, API, Shelly?)
- PWA Service Worker: vite-plugin-pwa einrichten
- Push-Benachrichtigungen (braucht Backend)
- GitHub-Repo: noch nicht erstellt
