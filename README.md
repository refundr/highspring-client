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

## Setup

```bash
yarn install
```

Optional environment:

```bash
export API_URL=http://127.0.0.1:8090
export SESSION_SECRET=dev-secret
```

Put your Google account email in the API `ADMIN_EMAILS` list to unlock `/admin`.

## Development

```bash
yarn dev
```

Open http://localhost:3000

## Build / start / typecheck

```bash
yarn build
yarn start
yarn typecheck
```

## Reports in admin

- **Allure** (API unit/integration): after `mvn -pl api -am allure:report verify` in `highspring-rest`, open **Admin → Allure test report**.
- **Playwright** (client E2E): after `yarn playwright test`, open **Admin → Playwright E2E report**, or use `yarn playwright show-report`. See [TEST.md](TEST.md).
