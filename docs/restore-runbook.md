# Restore runbook

Use this runbook to restore **Squishatlas** from a nightly backup produced by the `backup` service. It assumes you are running the standard Docker Compose stack from this repo.

Backups live on the `backups` Docker volume, mounted at `/backups` inside the `backup` container:

| Path | Contents |
|------|----------|
| `/backups/postgres/squishmallow-*.sql.gz` | Timestamped `pg_dump` archives (newest file is usually what you want) |
| `/backups/uploads/` | Mirror of the `uploads` volume (`/data/uploads` in `web` and `caddy`) |

**Test this runbook on a staging copy before you need it in production.**

## Before you start

1. Identify the backup you want to restore (pick the newest `squishmallow-*.sql.gz` unless you are rolling back to a specific point in time).
2. SSH into the host running the stack and `cd` to the project directory (where `docker-compose.yml` lives).
3. Confirm the stack is up: `docker compose ps`.

## Restore procedure

### 1. Stop the web app

Stopping `web` prevents new writes while you restore the database and uploads.

```bash
docker compose stop web
```

Leave `db`, `caddy`, and `backup` running. Caddy may serve errors while `web` is down — that is expected during restore.

### 2. Restore Postgres

Find the dump file inside the backup volume:

```bash
docker compose exec backup ls -lt /backups/postgres/
```

Copy the dump to the host (optional but makes the restore command easier to read):

```bash
DUMP=$(docker compose exec backup ls -t /backups/postgres/squishmallow-*.sql.gz | head -1)
docker compose cp "backup:${DUMP}" /tmp/restore.sql.gz
```

Drop and recreate the database, then load the dump:

```bash
docker compose exec db psql -U squishmallow -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'squishmallow' AND pid <> pg_backend_pid();"

docker compose exec db dropdb -U squishmallow squishmallow
docker compose exec db createdb -U squishmallow squishmallow

gunzip -c /tmp/restore.sql.gz | docker compose exec -T db psql -U squishmallow -d squishmallow
```

If you skip the copy step, pipe directly from the backup container:

```bash
docker compose exec backup sh -c 'gunzip -c "$(ls -t /backups/postgres/squishmallow-*.sql.gz | head -1)"' \
  | docker compose exec -T db psql -U squishmallow -d squishmallow
```

### 3. Restore uploads

The backup service mirrors uploads to `/backups/uploads`. Copy that mirror back onto the live `uploads` volume:

```bash
docker compose exec backup rsync -a --delete /backups/uploads/ /data/uploads/
```

Because `web` is stopped, nothing is writing to `/data/uploads` during this step.

### 4. Start the web app

```bash
docker compose start web
```

Wait a few seconds for the container to become healthy, then verify.

### 5. Verify the restore

**Health check** — should return HTTP 200 with `"db": "connected"`:

```bash
curl -fsS https://squishatlas.com/api/health
# or, for local/HTTP-only: curl -fsS http://localhost/api/health
```

**Spot-check tenants** — log in as superadmin at `/admin`, open a tenant you know existed before the incident, and confirm:

- Dashboard loads with expected squish counts
- At least one squish photo renders (checks both DB rows and files on disk)

If health fails or photos 404, re-check that both the Postgres restore and uploads rsync completed without errors.

## Troubleshooting

| Symptom | Likely cause | What to do |
|---------|--------------|------------|
| `psql` errors during restore | Wrong dump file or incomplete gzip | Pick a different timestamp; confirm file size is non-zero |
| Health OK but photos missing | Uploads not restored | Re-run step 3; confirm `/backups/uploads` has tenant subdirectories |
| Cannot log in | Restored an older DB than expected | Use a newer `squishmallow-*.sql.gz` or accept the rollback point |
| `dropdb` fails | Residual connections | Re-run the `pg_terminate_backend` query, then retry |

## After a successful restore

Note the backup timestamp you restored from and what incident prompted the restore. Schedule a fresh backup (or wait for the nightly cron) so you have a current baseline again.
