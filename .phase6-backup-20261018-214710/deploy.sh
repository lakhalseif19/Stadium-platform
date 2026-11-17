#!/usr/bin/env bash
# Usage : IMAGE_PREFIX=ghcr.io/org/repo bash deploy.sh <staging|production> <image_tag>
set -Eeuo pipefail

ENV_NAME="${1:?usage: deploy.sh <staging|production> <image_tag>}"
IMAGE_TAG="${2:?usage: deploy.sh <staging|production> <image_tag>}"
: "${IMAGE_PREFIX:?IMAGE_PREFIX requis}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
[ -f ".env.${ENV_NAME}" ] || { echo "Fichier .env.${ENV_NAME} introuvable sur le VPS"; exit 1; }

export ENV_NAME IMAGE_PREFIX IMAGE_TAG
COMPOSE=(docker compose -p "stadium-${ENV_NAME}" -f docker-compose.prod.yml --env-file ".env.${ENV_NAME}")
STATE_FILE=".last_good_tag.${ENV_NAME}"
PREVIOUS_TAG="$(cat "$STATE_FILE" 2>/dev/null || true)"

rollback() {
  if [ -n "$PREVIOUS_TAG" ]; then
    echo ">> ROLLBACK vers ${PREVIOUS_TAG}"
    IMAGE_TAG="$PREVIOUS_TAG" "${COMPOSE[@]}" up -d --remove-orphans --wait --wait-timeout 120 \
      || echo "!! Le rollback a aussi échoué : intervention manuelle requise"
    echo "NB : les migrations de base ne sont PAS annulées (voir docs/ci-cd.md)."
  else
    echo "!! Aucune version précédente connue : pas de rollback possible"
  fi
}

echo ">> [1/6] Démarrage de PostgreSQL et Redis"
"${COMPOSE[@]}" up -d --wait --wait-timeout 120 postgres redis

if [ "$ENV_NAME" = "production" ]; then
  echo ">> [2/6] Sauvegarde PostgreSQL avant migration"
  bash infrastructure/scripts/backup.sh "$ENV_NAME"
else
  echo ">> [2/6] Sauvegarde ignorée (staging)"
fi

echo ">> [3/6] Téléchargement des images ${IMAGE_TAG}"
"${COMPOSE[@]}" pull backend admin

echo ">> [4/6] Migrations"
# En cas d'échec, l'ancienne version tourne toujours : pas de rollback applicatif nécessaire.
"${COMPOSE[@]}" run --rm --no-deps backend npm run migration:run:prod \
  || { echo "!! Migration en échec : déploiement annulé, version actuelle conservée"; exit 1; }

echo ">> [5/6] Mise à jour des services"
"${COMPOSE[@]}" up -d --remove-orphans --wait --wait-timeout 120 \
  || { echo "!! Démarrage en échec"; rollback; exit 1; }

echo ">> [6/6] Finalisation"
echo "$IMAGE_TAG" > "$STATE_FILE"
docker image prune -f >/dev/null
echo "Déploiement ${IMAGE_TAG} OK (${ENV_NAME})"
