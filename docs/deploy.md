# Deploy Squishatlas

This guide walks a new owner from a clean VPS to a working **Squishatlas** instance at **squishatlas.com** — no prior knowledge of the codebase required.

Squishatlas is a self-hosted, multi-tenant web app for cataloguing Squishmallow collections. It runs as a Docker Compose stack: Next.js app, Postgres, Caddy reverse proxy, nightly backups, and a one-shot migrate/seed job on boot.

## What you need

- A VPS with Docker and Docker Compose v2 installed (2 vCPU / 4 GB RAM is comfortable; image processing is the main CPU spike)
- DNS for **squishatlas.com** (and `www` if you want it) pointing at the VPS public IP
- An SMTP password for `no-reply@squishatlas.com` (all other mail settings are pre-configured)
- About 15 minutes for first boot

## Services in `docker-compose.yml`

| Service | Role |
|---------|------|
| **`web`** | Next.js app (standalone build). Serves the UI and API on port 3000 inside the network. Mounts the `uploads` volume read-write at `/data/uploads`. |
| **`db`** | PostgreSQL 16. Persistent data on the `pgdata` volume. |
| **`migrate`** | One-shot container on every `docker compose up`: runs Drizzle migrations, seeds the superadmin if missing, verifies schema. Exits when done; `web` waits for success. |
| **`caddy`** | Reverse proxy on ports 80/443. Terminates TLS (Let's Encrypt when `CADDY_DOMAIN` is set), proxies everything except `/uploads` to `web`, serves uploaded images directly from the `uploads` volume. |
| **`backup`** | Long-running sidecar with a nightly cron job: `pg_dump` to `/backups/postgres/` and `rsync` of uploads to `/backups/uploads/`. Retains the last 14 Postgres dumps by default. |

Named volumes: `pgdata`, `uploads`, `backups`, `caddy_data`, `caddy_config`. Backups survive container recreation because they live on the `backups` volume (mount it to the host for off-site copies if you want extra safety).

## Environment variables

Copy `.env.example` to `.env` in the project root and set every value below before first boot.

### Application (required by `web` and `migrate`)

| Variable | Purpose | How to set |
|----------|---------|------------|
| `DATABASE_URL` | Postgres connection string for Drizzle and Better Auth | In Compose, derived automatically as `postgresql://squishmallow:${POSTGRES_PASSWORD}@db:5432/squishmallow`. For local dev outside Docker, point at your Postgres instance. |
| `BETTER_AUTH_SECRET` | Signs session cookies | Generate: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Public base URL of the app (redirects, callbacks) | Production: `https://squishatlas.com` |
| `SMTP_HOST` | Outbound mail server | **Pre-known:** `mail.bmail.im` (default in `.env.example`) |
| `SMTP_PORT` | SMTP port | **Pre-known:** `465` (implicit TLS) |
| `SMTP_SECURE` | Enable TLS | **Pre-known:** `true` |
| `SMTP_USER` | SMTP auth / from address | **Pre-known:** `no-reply@squishatlas.com` |
| `SMTP_PASSWORD` | SMTP auth password | **You supply** — obtain from your mail provider |
| `UPLOADS_DIR` | Where squish photo files live | **Pre-known in Docker:** `/data/uploads` (set by Compose) |
| `SUPERADMIN_EMAIL` | Email for the first superadmin account | Your admin email |
| `SUPERADMIN_INITIAL_PASSWORD` | Initial superadmin password (must change on first login) | Choose a strong temporary password |

### Docker Compose only

| Variable | Purpose | How to set |
|----------|---------|------------|
| `POSTGRES_PASSWORD` | Postgres password for user `squishmallow` | Choose a strong password; must match what `DATABASE_URL` would use |
| `CADDY_DOMAIN` | Hostname for HTTPS site block | `squishatlas.com` (Caddy obtains Let's Encrypt certs automatically) |
| `CADDY_TLS_CERT` | Manual TLS cert path (optional) | Leave empty to use automatic HTTPS |
| `CADDY_TLS_KEY` | Manual TLS key path (optional) | Leave empty to use automatic HTTPS |
| `BACKUP_RETENTION` | Number of nightly Postgres dumps to keep | Default `14` |
| `BACKUP_CRON` | Cron schedule for backups (UTC) | Default `0 2 * * *` (02:00 UTC daily) |

## First-boot checklist

### 1. Clone and configure

```bash
git clone <your-repo-url> squishatlas
cd squishatlas
cp .env.example .env
```

Edit `.env`:

```env
POSTGRES_PASSWORD=<strong-password>
BETTER_AUTH_SECRET=<output of openssl rand -base64 32>
BETTER_AUTH_URL=https://squishatlas.com
SMTP_PASSWORD=<from mail provider>
SUPERADMIN_EMAIL=you@example.com
SUPERADMIN_INITIAL_PASSWORD=<temporary-password>
CADDY_DOMAIN=squishatlas.com
```

Ensure DNS for `squishatlas.com` already resolves to this server before starting Caddy (Let's Encrypt validation needs that).

### 2. Start the stack

```bash
docker compose up --build -d
```

**Important:** always use `--build` after pulling code changes. Without it, Docker may keep an old `web` image from the initial scaffold (only `/` worked; `/login` and the rest 404'd). The image build also needs placeholder auth env vars at build time — see `Dockerfile` — runtime secrets still come from your `.env`.

Watch first boot:

```bash
docker compose logs -f migrate
```

You should see migrations apply, superadmin seed, and schema verification succeed. Then `web` starts.

### 3. Confirm health

```bash
curl -fsS https://squishatlas.com/api/health
```

Expected: `{"status":"ok","db":"connected"}`

### 4. First superadmin login

1. Open `https://squishatlas.com/login`
2. Sign in with `SUPERADMIN_EMAIL` / `SUPERADMIN_INITIAL_PASSWORD`
3. You will be forced to `/change-password` — set a new password before continuing
4. Open `/admin` to manage tenants

### 5. Create the first tenant

From `/admin`, invite or create a tenant (family collection). Each tenant gets a private dashboard at `/t/{slug}`.

### 6. Install as PWA (optional)

On a phone, visit the tenant dashboard and use the browser's "Add to Home Screen" — the app name **Squishatlas** and icons come from the web manifest.

## PWA / branding notes

- App name: **Squishatlas**
- Production domain: **squishatlas.com**
- Transactional email from: **no-reply@squishatlas.com**

These are baked into defaults and docs; you do not need to fork code to rename the product.

## Backups and restore

- Nightly backups run automatically in the `backup` service.
- After 24 hours, check: `docker compose exec backup ls -lt /backups/postgres/` and `docker compose exec backup ls /backups/uploads/`
- To restore from backup, follow [restore-runbook.md](./restore-runbook.md).

## Optional: Dokploy / Coolify

The Compose file is fully standalone — `docker compose up` is all you need. Platforms like **Dokploy** or **Coolify** can wrap the same `docker-compose.yml` for git-push deploys, env-var UI, and log aggregation. Point them at this repo and supply the `.env` values above; no code changes required.

## Open items (owner decisions)

These were flagged in the product plan and are **not** blockers for a first deploy, but you should decide consciously:

| Item | Status | Notes |
|------|--------|-------|
| Domain | **Decided** | `squishatlas.com` |
| App name | **Decided** | Squishatlas |
| Email provider | **Decided** | SMTP via `mail.bmail.im`, port 465, sender `no-reply@squishatlas.com` — only `SMTP_PASSWORD` is secret |
| VPS provider and specs | **You choose** | 2 vCPU / 4 GB recommended; any provider with Docker works |
| Public pages `noindex` default | **Recommended yes** | Public tenant pages are made by children; default is noindex with per-tenant opt-in — confirm this matches your comfort level in tenant settings |

## Day-two operations

| Task | Command |
|------|---------|
| View logs | `docker compose logs -f web` |
| Restart app | `docker compose restart web` |
| Apply schema updates after pull | `docker compose up --build -d` (migrate re-runs) |
| Manual backup now | `docker compose exec backup /usr/local/bin/run-backup.sh` |
| Update TLS / domain | Change `CADDY_DOMAIN`, restart `caddy` |

## Getting help

- Health failing: check `docker compose ps` and `docker compose logs db web migrate`
- Email not sending: verify `SMTP_PASSWORD` and that port 465 outbound is open on the VPS
- Photo upload `EACCES` on `/data/uploads`: rebuild web (`docker compose up --build -d web`) or run `docker compose exec -u root web chown nextjs:nodejs /data/uploads`
- Restore after data loss: [restore-runbook.md](./restore-runbook.md)
