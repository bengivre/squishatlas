# Squishatlas

**A cozy night-sky home for every Squishmallow** — photos, stories, and glowing family trees.

Squishatlas turns a growing pile of plushies into a tidy shelf kids can explore and parents can keep private. Use it for free at **[www.squishatlas.com](https://www.squishatlas.com)** — create a shelf, add your squishies, and share only what you choose.

## What you can do

| Feature | Purpose |
|---------|---------|
| **Collection** | Catalogue each Squishmallow with a name, story, adopted date, favourites, and photos. |
| **Photos** | Upload and crop pictures; the app builds thumbnails so browsing stays fast. |
| **Constellation** | Group squishies into families and link relationships (parents, siblings, friends). |
| **Orbit** | Bookmark another family’s public shelf so you can find it again easily. |
| **Public hub, gallery & tree** | Optionally share a soft public window with grandparents — password-protectable, off by default. |
| **Stats** | See collection size, friendships, loners, and adoption timeline at a glance. |
| **Settings** | Control privacy, welcome text, sharing, and sign-out. |
| **Accounts** | Email sign-up, verification, password reset, and invited owners. |

Private by default. No marketplace, no trading — just your family’s shelf.

## Use it free

1. Open [https://www.squishatlas.com](https://www.squishatlas.com)
2. **Create a shelf** (or sign in)
3. Add squishies, photos, and constellation links
4. Optionally enable public pages when you’re ready to share

## Self-host with Docker

Prefer to run your own instance? You need Docker Compose, a domain (for HTTPS), and SMTP credentials for invites and password resets.

```bash
git clone <repository-url>
cd squishmallow
cp .env.example .env
```

Edit `.env` and set at least:

| Variable | Notes |
|----------|--------|
| `POSTGRES_PASSWORD` | Strong password for Postgres |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Public URL, e.g. `https://your-domain.com` |
| `SMTP_PASSWORD` | Required for email (other SMTP fields have defaults) |
| `SUPERADMIN_EMAIL` / `SUPERADMIN_INITIAL_PASSWORD` | First admin account |
| `CADDY_DOMAIN` | Your domain (Caddy handles Let’s Encrypt) |

Point DNS at your server, then:

```bash
docker compose up --build -d
```

On first boot the stack migrates the database, seeds the superadmin, and starts the app behind Caddy. Log in, change the admin password when prompted, then open `/admin`.

| Service | Role |
|---------|------|
| `web` | Next.js app |
| `db` | PostgreSQL 16 |
| `migrate` | One-shot migrations + seed |
| `caddy` | TLS reverse proxy |
| `backup` | Nightly database + uploads backup |

Health check: `GET /api/health`

Deeper ops (backups, restore, VPS notes): **[docs/deploy.md](docs/deploy.md)**.

### Local development (optional)

```bash
cp .env.example .env   # fill in secrets
docker compose -f docker-compose.dev.yml up -d   # Postgres only
npm install
npm run db:migrate
npm run dev
```

## Contributing

If you like Squishatlas, pull requests are welcome — star the repo, open an issue, or send a cozy improvement.

---

Made with love in Canada 🇨🇦
