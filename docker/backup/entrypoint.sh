#!/bin/sh
set -eu

CRON_SCHEDULE="${BACKUP_CRON:-0 2 * * *}"

mkdir -p /var/log
echo "${CRON_SCHEDULE} /usr/local/bin/run-backup.sh >> /var/log/backup.log 2>&1" | crontab -

echo "[backup] Scheduled nightly job: ${CRON_SCHEDULE}"
exec crond -f -l 2
