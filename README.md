# DropBag

Race-day planning for ultrarunners and their crews.

- **Aid station plan**: every station, mile marker, cutoff and crew note, sorted by mile
- **Drop bag checklists**: pack each bag item by item and track progress
- **Crew link**: a private, read-only link your crew opens on their phone with no account needed. You can reset it at any time.
- **Pacer Finder**: public board to find a pacer or offer to pace
- **Accounts and plans**: email/password sign-up. The Free plan includes 2 races and Pro is unlimited. Billing is not wired up yet.

## Stack

Express 5 + SQLite (`better-sqlite3`) API under `/api`, and a React 19 + Vite frontend in `client/`.
In production, Express serves the built frontend, so it runs as a single service.

## Run locally

```bash
npm install
npm run seed          # optional: demo account demo@dropbag.app / dropbag-demo
npm run dev           # API on :3000 (restarts on change)
npm run dev:client    # in a second terminal: web app on :5173, proxies /api to :3000
```

## Test

```bash
npm test              # API tests (auth, ownership, plan limits, crew links)
```

## Deploy

The repo ships a `Dockerfile` that builds the web app and runs the server, so it deploys as one service
on any host that runs containers. SQLite needs a **persistent volume** mounted at `/data`.

### Railway (recommended, about $5/month)

1. Go to railway.com, sign in with GitHub, then choose **New Project → Deploy from GitHub repo → DropBag**.
   Railway finds `railway.json` and builds with the Dockerfile.
2. In the service's **Settings → Source**, pick the branch to deploy.
3. **Variables:** add `JWT_SECRET` set to a long random string (40+ characters).
4. **Volume:** right-click the service → **Attach volume** → mount path `/data`.
5. **Settings → Networking → Generate Domain** gives you a public `https://….up.railway.app` URL.

### Anywhere else

```bash
docker build -t dropbag .
docker run -p 3000:3000 -e JWT_SECRET=<long random string> -v dropbag-data:/data dropbag
```

| Variable | Default | Purpose |
|---|---|---|
| `JWT_SECRET` | random in dev | Signs login sessions. **Required in production.** |
| `PORT` | `3000` | HTTP port (set automatically by most hosts) |
| `DB_PATH` | `data/dropbag.db` (`/data/dropbag.db` in Docker) | SQLite file location |
| `FREE_RACE_LIMIT` | `2` | Races allowed on the Free plan |

To load the demo account on a server: `node scripts/seed.js` (demo@dropbag.app / dropbag-demo).

## Roadmap

- Stripe checkout for Pro (set `users.plan = 'pro'` from the webhook)
- Live runner check-ins on the crew view
- Password reset email
- Add to Home Screen support (PWA) for offline crew access
