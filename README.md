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

```bash
npm install && npm run build
NODE_ENV=production JWT_SECRET=<long random string> npm start
```

| Variable | Default | Purpose |
|---|---|---|
| `JWT_SECRET` | random in dev | Signs login sessions. **Required in production.** |
| `PORT` | `3000` | HTTP port |
| `DB_PATH` | `data/dropbag.db` | SQLite file. Put it on a persistent volume. |
| `FREE_RACE_LIMIT` | `2` | Races allowed on the Free plan |

Any host with a persistent disk works, for example Render, Railway or Fly.io.

## Roadmap

- Stripe checkout for Pro (set `users.plan = 'pro'` from the webhook)
- Live runner check-ins on the crew view
- Password reset email
- Add to Home Screen support (PWA) for offline crew access
