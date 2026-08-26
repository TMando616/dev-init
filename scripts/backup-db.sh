#!/bin/sh
set -eu
cd "$(dirname "$0")/.."

# docker compose 自体は ./.env を自動で読むが、このスクリプト内で
# $DB_USERNAME / $DB_DATABASE をそのまま使うにはシェル側にも読み込む必要がある。
set -a
. ./.env
set +a

BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)

docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U "$DB_USERNAME" "$DB_DATABASE" | gzip > "$BACKUP_DIR/devinit-${STAMP}.sql.gz"

# 直近14世代のみ残す
ls -1t "$BACKUP_DIR"/devinit-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm --
