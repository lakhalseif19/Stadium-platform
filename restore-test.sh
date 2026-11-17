#!/usr/bin/env bash
# Vérifie qu'une sauvegarde est réellement restaurable (conteneur jetable).
# Usage : bash restore-test.sh /var/backups/stadium/production/stadium_XXXX.dump
set -Eeuo pipefail

DUMP="${1:?usage: restore-test.sh <fichier.dump>}"
[ -s "$DUMP" ] || { echo "Fichier introuvable ou vide"; exit 1; }
NAME="restore-test-$$"
trap 'docker rm -f "$NAME" >/dev/null 2>&1 || true' EXIT

docker run -d --name "$NAME" -e POSTGRES_PASSWORD=test -e POSTGRES_DB=restore postgis/postgis:16-3.4 >/dev/null
for _ in $(seq 1 30); do
  docker exec "$NAME" pg_isready -U postgres -d restore >/dev/null 2>&1 && break
  sleep 2
done

docker exec -i "$NAME" pg_restore -U postgres -d restore --no-owner --exit-on-error < "$DUMP"

TABLES="$(docker exec "$NAME" psql -U postgres -d restore -Atc \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")"
docker exec "$NAME" psql -U postgres -d restore -Atc "SELECT 1 FROM reservations LIMIT 1" >/dev/null
echo "Restauration OK : ${TABLES} tables dans le schéma public"
