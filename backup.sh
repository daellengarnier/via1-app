#!/bin/bash
BACKUP_FILE="/opt/backups/via1_$(date +%Y%m%d_%H%M%S).sql"
docker compose -f /opt/via1-app/docker-compose.yml exec -T db pg_dump -U postgres via1 > "$BACKUP_FILE"
# Keep only last 14 days of backups
find /opt/backups -name "via1_*.sql" -mtime +14 -delete
