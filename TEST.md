# E2E tests (Playwright)

Thin Chromium smoke for the storefront checkout path. Lives in `e2e/`.

## Prerequisites

1. **API** running on `8090` with `E2E_AUTH_ENABLED=true` in `application.properties` (see `highspring-rest` `application.template.properties`). Restart the API after changing that flag.
2. **Node** ≥ 20 and Yarn in this repo (`highspring-client`).
3. Chromium for Playwright (once):

```bash
yarn playwright install chromium
```

## Run

```bash
export API_URL=http://127.0.0.1:8090
export E2E_LOGIN_SECRET=highspring-e2e-secret

yarn playwright test
```

Playwright starts Remix via `webServer` in `playwright.config.ts`, or reuses a server already on port 3000.

If you see `Timed out waiting … from config.webServer`, either start the app yourself first (`yarn dev`, then re-run tests) or confirm nothing else is bound to that port (`lsof -iTCP:3000 -sTCP:LISTEN`).

### Variants

```bash
yarn playwright test --ui          # interactive UI
yarn playwright test --headed      # watch the browser
yarn playwright show-report        # local static server for last HTML report
```

## Viewing the report

After a run, Playwright writes `playwright-report/`.

1. **CLI:** `yarn playwright show-report`
2. **Admin UI (ADMIN role):** open **Admin → Playwright E2E report**, or
   `http://localhost:3000/admin/playwright/index.html`

The admin route serves files from `playwright-report/` with the same cookie gate as the rest of `/admin` (must be signed in as ADMIN).

## What the smoke covers

Sign in (gated E2E login, no Google) → add to cart → Pay → thank-you page.

- API: `POST /v1/auth/e2e/login/` (only when `E2E_AUTH_ENABLED=true`)
- Client: `POST /e2e/session` with header `x-e2e-secret` matching `E2E_LOGIN_SECRET`

If E2E login returns 404, rebuild/restart the API so `AuthE2eLoginResource` is on the classpath (`E2E_AUTH_ENABLED=true` alone is not enough if the process was started before that class existed). Quick check:

```bash
curl -s -X POST http://127.0.0.1:8090/v1/auth/e2e/login/ \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"email":"e2e@example.com","displayName":"E2E"}'
```

Expect JSON with `sessionId`. `Not found` means restart the API after a compile.
