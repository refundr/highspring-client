# Client architecture

This Remix app is a **storefront BFF** (backend-for-frontend) in front of the Java API in `highspring-rest`.

```
Browser (localhost:3000)
    │  cookie: __highspring  (httpOnly — JS cannot read it)
    ▼
Remix loaders / actions  (Node)
    │  Authorization: session:{uuid}
    ▼
Jetty API (localhost:8090)
```

## Why a BFF?

The browser never holds the API session UUID in `localStorage` or JS. Remix keeps it inside a signed **httpOnly cookie**, then attaches `Authorization: session:…` only on **server-side** `fetch` calls to the API.

That reduces XSS impact: stealing page JS does not easily give you the API bearer token.

## Remix mental model

| Concept | File pattern | When it runs |
|---------|--------------|--------------|
| **Route** | `app/routes/*.tsx` | URL → this module |
| **`loader`** | export in a route | On GET — load data before render |
| **`action`** | export in a route | On POST/PUT/DELETE form submits |
| **Component** | `export default` | Renders HTML (runs on server + hydrates in browser) |
| **`*.server.ts`** | `app/utils/*.server.ts` | **Server only** — never bundled for the browser |

File names map to URLs (Remix file-based routing):

| File | URL |
|------|-----|
| `_index.tsx` | `/` |
| `shop.tsx` | `/shop` |
| `checkout.tsx` | `/checkout` |
| `logout.tsx` | `/logout` |
| `auth.callback.tsx` | `/auth/callback` |
| `admin.tsx` | `/admin` |
| `admin.allure.$.tsx` | `/admin/allure/*` (splat proxy) |
| `admin.playwright.$.tsx` | `/admin/playwright/*` (local `playwright-report/`) |
| `admin.javadoc.$.tsx` | `/admin/javadoc/*` (splat proxy) |

## Auth flow (Google)

1. `/` loader asks the API for a Google consent URL (`POST /v1/auth/google/url/`).
2. User signs in at Google; Google redirects to `/auth/callback?code=…`.
3. Callback loader exchanges the code (`POST /v1/auth/google/callback/`) → gets `sessionId`, `email`, `role`, …
4. We store that JSON in the Remix cookie via `commitUserSession`.
5. Later loaders call `readSessionUser(request)` and pass `sessionId` into `api.server.ts` helpers.

Logout (`POST /logout`):

1. Call `DELETE /v1/auth/logout/` so the API deletes the `api_session` row.
2. Clear the Remix cookie.

## Styling (Tailwind)

- Theme tokens live in `app/app.css` (`@theme { … }`).
- Reusable class bundles live in `app/utils/ui.ts` (`btn`, `panel`, `shell`, …).
- Prefer Tailwind utilities in JSX; put repeated strings in `ui.ts` so buttons look consistent.

## Security (simple picture)

| Topic | What we do |
|-------|------------|
| CORS | Handled on the **API**; Remix talks to the API from the server, not from the browser |
| CSP | Response headers in `app/root.tsx` |
| CSRF | Cookie `SameSite=Lax` + form POSTs; API token is not a cookie |
| Admin UI | Cookie `role === "ADMIN"` is a convenience check; the **API** still enforces admin |

## Where to read next

1. `app/utils/session.server.ts` — cookie session
2. `app/utils/api.server.ts` — all API calls
3. `app/routes/shop.tsx` — loader + action pattern
4. `app/routes/logout.tsx` — revoke API session
5. `highspring-rest/docs/ARCHITECTURE.md` — Java API resource tree
