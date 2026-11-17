#!/usr/bin/env bash
# Usage : bash backup.sh <staging|production>   (aussi utilisable en cron)
set -Eeuo pipefail

ENV_NAME="${1:?usage: backup.sh <staging|production>}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

export ENV_NAME IMAGE_PREFIX="${IMAGE_PREFIX:-unused}" IMAGE_TAG="${IMAGE_TAG:-unused}"
COMPOSE=(docker compose -p "stadium-${ENV_NAME}" -f docker-compose.prod.yml --env-file ".env.${ENV_NAME}")
BACKUP_DIR="${BACKUP_DIR:-/var/backups/stadium/${ENV_NAME}}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
FILE="$BACKUP_DIR/stadium_$(date -u +%Y%m%dT%H%M%SZ).dump"

"${COMPOSE[@]}" exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "${FILE}.part"
[ -s "${FILE}.part" ] || { echo "Sauvegarde vide : échec"; rm -f "${FILE}.part"; exit 1; }
mv "${FILE}.part" "$FILE"

find "$BACKUP_DIR" -name 'stadium_*.dump' -mtime +"$RETENTION_DAYS" -delete
echo "Sauvegarde créée : $FILE ($(du -h "$FILE" | cut -f1))"
