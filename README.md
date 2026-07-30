# Highspring Client

Simple Remix storefront for the Highspring shopping cart API.

Start with [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — BFF cookie pattern, Remix loaders/actions, and auth/logout. Playwright: [TEST.md](TEST.md).

## Prerequisites

- Node.js >= 20
- [Yarn](https://yarnpkg.com/) (Classic / v1)

## Features

- Google sign-in (via the REST API)
- Shop: product images, server-persisted cart quantities, checkout later
- Admin (role `ADMIN`): sales KPIs, purchases, 500 error log, Allure report proxy
- UI styled with [Tailwind CSS](https://tailwindcss.com/) v4 (`app/app.css` + `app/utils/ui.ts`)

## Folder map (quick)

| Path | Purpose |
|------|---------|
| `app/routes/` | One file ≈ one URL (loaders, actions, UI) |
| `app/components/` | Shared React pieces (nav, footer) |
| `app/utils/*.server.ts` | Server-only helpers (API + cookie session) |
| `app/utils/ui.ts` | Reusable Tailwind class strings |
| `app/app.css` | Tailwind theme tokens |
| `docs/ARCHITECTURE.md` | BFF, auth, routing, and Tailwind overview |
| `tsconfig.json` | TypeScript project config |

## Setup / start (dev)

With the Highspring API already running locally:

```bash
yarn
yarn playwright test
yarn dev
```

- `yarn` — install dependencies  
- `yarn playwright test` — run E2E smoke tests (API must be up; see [TEST.md](TEST.md))  
- `yarn dev` — start the Remix app at http://localhost:3000  

Optional environment:

```bash
export API_URL=http://127.0.0.1:8090
export SESSION_SECRET=dev-secret
```

New Google sign-ins are **ADMIN** by default (easy admin demo). `ADMIN_EMAILS` is still accepted in config for compatibility but is not required for admin access.

## Deploy on Render

Native Node (no Docker). Blueprint: `render.yaml`.

1. Deploy **highspring-rest** first (see that repo’s README).
2. Blueprint-deploy this repo (or create a Node web service with `yarn install && yarn build` / `yarn start`).
3. Set env:
   - `API_URL=https://<highspring-api>.onrender.com`
   - `PUBLIC_APP_URL=https://<this-service>.onrender.com` (no trailing slash; used for Google OAuth)
   - `SESSION_SECRET` (auto-generated if using the blueprint)
4. In Google Cloud Console → Credentials → your Web client, add:
   - Authorized redirect URI: `https://<this-service>.onrender.com/auth/callback`
   - Authorized JavaScript origin: `https://<this-service>.onrender.com`
   Keep the localhost entries for local dev. Exact match required (`https`, no trailing slash on the callback path beyond `/auth/callback`).

## Build / start / typecheck

```bash
yarn build
yarn start
yarn typecheck
```

## Reports in admin

- **Allure** (API unit/integration): in `highspring-rest` run `mvn -pl api -am verify && mvn javadoc:aggregate`, restart the API, then open **Admin → Allure test report**.
- **Playwright** (client E2E): after `yarn playwright test`, open **Admin → Playwright E2E report**, or use `yarn playwright show-report`. The HTML under `playwright-report/` is committed for prod Admin. See [TEST.md](TEST.md).
