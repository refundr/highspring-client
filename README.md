# Highspring Client

Simple Remix storefront for the Highspring shopping cart API.

## Prerequisites

- Node.js >= 20
- [Yarn](https://yarnpkg.com/) (Classic / v1)

## Features

- Google sign-in (via the REST API)
- Shop: product images, server-persisted cart quantities, checkout later
- Admin (role `ADMIN`): sales KPIs, purchases, 500 error log, Allure report proxy

## Setup

```bash
yarn install
```

Optional environment:

```bash
export API_URL=http://127.0.0.1:8090
export SESSION_SECRET=dev-secret
```

In Google Cloud Console, add redirect URI:

`http://localhost:3000/auth/callback`

That same URI must match `GOOGLE_REDIRECT_URI` on the API. Put your Google account email in the API `ADMIN_EMAILS` list to unlock `/admin`.

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

## Allure in admin

After the API publishes a report (`mvn -pl api -am allure:report verify` in `highspring-rest`), open **Admin → Allure test report**. The page proxies `/v1/admin/allure/...` with your admin session.
