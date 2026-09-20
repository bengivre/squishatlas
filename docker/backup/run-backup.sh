#!/bin/sh
set -eu

BACKUP_DIR="/backups"
PG_DIR="${BACKUP_DIR}/postgres"
UPLOADS_SRC="/data/uploads"
UPLOADS_DEST="${BACKUP_DIR}/uploads"
RETENTION="${BACKUP_RETENTION:-14}"
STAMP="$(date -u +%Y-%m-%dT%H%M%SZ)"

mkdir -p "$PG_DIR" "$UPLOADS_DEST"

echo "[backup] Starting backup at ${STAMP}"

DUMP_FILE="${PG_DIR}/squishmallow-${STAMP}.sql.gz"
pg_dump --no-owner --no-acl | gzip > "$DUMP_FILE"
echo "[backup] Wrote ${DUMP_FILE} ($(wc -c < "$DUMP_FILE") bytes)"

rsync -a --delete "${UPLOADS_SRC}/" "${UPLOADS_DEST}/"
echo "[backup] Synced uploads to ${UPLOADS_DEST}"

if [ "$RETENTION" -gt 0 ]; then
  ls -1t "${PG_DIR}"/squishmallow-*.sql.gz 2>/dev/null |
    tail -n +$((RETENTION + 1)) |
    while read -r old; do
      rm -f "$old"
      echo "[backup] Pruned ${old}"
    done
fi

echo "[backup] Done"
