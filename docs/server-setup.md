# Server-Setup Anleitung (Infomaniak VPS)

Diese Anleitung ist fuer die **Claude lokale Session**, die per SSH auf den Infomaniak VPS zugreift. Ziel: Die gesamte Infrastruktur aufsetzen, sodass danach alle Aenderungen via GitHub Auto-Deploy live gehen.

## Voraussetzungen

**Daniel bereitet vor (manuell):**
- [ ] VPS ist erreichbar via SSH
- [ ] SSH-Key ist eingerichtet (Server stellt Key)
- [ ] DNS: `app.felsenau.org` zeigt auf die VPS-IP (A-Record)
- [ ] Port 80 und 443 sind offen (Firewall)
- [ ] Port 22 offen fuer SSH

**Claude braucht:**
- SSH-Zugang zum VPS (Key oder Credentials)
- GitHub Deploy Key oder Personal Access Token (fuer `git pull` auf dem Server)

---

## Schritt 1: System vorbereiten

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Grundlegende Tools installieren
sudo apt install -y curl git ufw
```

## Schritt 2: Docker installieren

```bash
# Docker GPG Key und Repository hinzufuegen
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Docker ohne sudo nutzbar machen
sudo usermod -aG docker $USER

# Pruefen ob Docker laeuft
sudo systemctl enable docker
sudo systemctl start docker
docker --version
docker compose version
```

> **Hinweis:** Nach `usermod` muss die SSH-Session neu gestartet werden, damit die Gruppenrechte greifen.

## Schritt 3: Projekt-Verzeichnis einrichten

```bash
# App-Verzeichnis erstellen
sudo mkdir -p /opt/via1-app
sudo chown $USER:$USER /opt/via1-app

# Repo klonen
cd /opt/via1-app
git clone git@github.com:daellengarnier/via1-app.git .

# Environment-Datei erstellen
cp .env.example .env
# -> .env editieren: DB-Passwoerter, NEXTAUTH_SECRET etc. setzen
```

## Schritt 4: Firewall konfigurieren

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (fuer Let's Encrypt)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

## Schritt 5: Docker Services starten

```bash
cd /opt/via1-app
docker compose up -d

# Pruefen ob alles laeuft
docker compose ps
docker compose logs -f
```

## Schritt 6: SSL-Zertifikat mit Let's Encrypt

```bash
# Certbot installieren (laeuft als Docker-Container oder nativ)
sudo apt install -y certbot

# Zertifikat holen (Nginx muss kurz gestoppt werden)
docker compose stop nginx
sudo certbot certonly --standalone -d app.felsenau.org
docker compose start nginx

# Auto-Renewal einrichten
sudo systemctl enable certbot.timer
```

> Die Zertifikate liegen unter `/etc/letsencrypt/live/app.felsenau.org/` und werden in den Nginx-Container gemountet.

## Schritt 7: Datenbank initialisieren

```bash
cd /opt/via1-app

# Prisma Migrationen ausfuehren
docker compose exec app npx prisma migrate deploy

# Erstbenutzer anlegen (Seed-Script)
docker compose exec app npx prisma db seed
```

Das Seed-Script legt an:
- **Alain** (muss bei Erstanmeldung Passwort setzen)
- **Yves** (muss bei Erstanmeldung Passwort setzen)

## Schritt 8: Testen

```bash
# Pruefen ob die App erreichbar ist
curl -I https://app.felsenau.org

# Logs kontrollieren
docker compose logs -f app
```

---

## GitHub Actions Auto-Deploy

Die Datei `.github/workflows/deploy.yml` wird im Repo erstellt. Sie:

1. Triggered bei Push auf `main`
2. Baut das Docker Image
3. Verbindet sich via SSH zum VPS
4. Pullt den neuesten Code
5. Rebuild und Restart der Container

### Voraussetzungen fuer Auto-Deploy

Im GitHub Repository unter Settings > Secrets folgende Secrets anlegen:

| Secret | Beschreibung |
|--------|-------------|
| `VPS_HOST` | IP-Adresse oder Hostname des VPS |
| `VPS_USER` | SSH-Username auf dem VPS |
| `VPS_SSH_KEY` | Privater SSH-Key fuer den Zugang |
| `VPS_PORT` | SSH-Port (Standard: 22) |

---

## Rollback-Anleitung

Falls ein Deployment Probleme verursacht:

### Schneller Rollback (vorheriges Image)

```bash
cd /opt/via1-app

# Letzten funktionierenden Stand anzeigen
git log --oneline -10

# Auf vorherigen Commit zurueck
git checkout <commit-hash>
docker compose up -d --build

# Wenn alles wieder laeuft und der Fix auf main kommt:
git checkout main
git pull
docker compose up -d --build
```

### Datenbank-Rollback

```bash
# Letzte Migration rueckgaengig machen (Vorsicht!)
docker compose exec app npx prisma migrate reset
# ACHTUNG: Das loescht alle Daten! Nur im Notfall.

# Besser: Backup zuerst
docker compose exec db pg_dump -U postgres via1 > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup wiederherstellen
docker compose exec -T db psql -U postgres via1 < backup_DATUM.sql
```

### Regulaere Backups

```bash
# Cronjob fuer taegliches DB-Backup (auf dem VPS einrichten)
# crontab -e
0 3 * * * cd /opt/via1-app && docker compose exec -T db pg_dump -U postgres via1 > /opt/backups/via1_$(date +\%Y\%m\%d).sql
```

---

## Verzeichnisstruktur auf dem VPS

```
/opt/via1-app/           # Hauptverzeichnis
├── .env                 # Environment-Variablen (NICHT im Repo!)
├── docker-compose.yml   # Docker-Konfiguration
├── ...                  # Rest des Repos
/opt/backups/            # DB-Backups
/etc/letsencrypt/        # SSL-Zertifikate
```

---

## Troubleshooting

| Problem | Loesung |
|---------|---------|
| Container startet nicht | `docker compose logs <service>` pruefen |
| Port 443 belegt | `sudo lsof -i :443` - anderen Service stoppen |
| SSL-Zertifikat abgelaufen | `sudo certbot renew` |
| DB-Verbindung fehlgeschlagen | `.env` pruefen, `docker compose restart db` |
| Speicher voll | `docker system prune -a` (entfernt ungenutzte Images) |
| Deploy fehlgeschlagen | GitHub Actions Log pruefen, SSH-Verbindung testen |
