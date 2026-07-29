import { createCookieSessionStorage } from "@remix-run/node";
import type { Session } from "~/utils/api.server";

/**
 * Remix cookie session storage.
 *
 * Think of this as a sealed envelope the browser carries on every request:
 * - Cookie name: `__highspring`
 * - httpOnly: JavaScript in the page cannot read it (XSS harder to steal)
 * - sameSite: "lax" — basic CSRF protection for cross-site POSTs
 * - Inside the envelope we store one key: `user` → JSON Session from the API
 *
 * This is NOT the same as the API's `api_session` table row. The cookie holds a
 * copy of sessionId/email/role so loaders don't need to hit Google again.
 * Signing out should revoke BOTH (see routes/logout.tsx).
 */
const storage = createCookieSessionStorage({
  cookie: {
    name: "__highspring",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    // Change SESSION_SECRET in real deploys — the default is only for local demos.
    secrets: [process.env.SESSION_SECRET || "highspring-dev-secret"],
    secure: process.env.NODE_ENV === "production",
  },
});

/** Low-level: parse the cookie jar from the incoming request. */
export async function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

/**
 * Returns the signed-in user, or null if nobody is logged in.
 * Call this at the top of almost every protected loader/action.
 */
export async function readSessionUser(request: Request): Promise<Session | null> {
  const session = await getUserSession(request);
  const raw = session.get("user");
  return raw ? (JSON.parse(raw) as Session) : null;
}

/**
 * Write a fresh session cookie after Google login (or after refreshing role via /v1/me/).
 * Return value goes in `Set-Cookie` on a Remix Response/redirect.
 */
export async function commitUserSession(user: Session) {
  const session = await storage.getSession();
  session.set("user", JSON.stringify(user));
  return storage.commitSession(session);
}

/**
 * Clear the Remix cookie only. Prefer routes/logout.tsx which also revokes the API session.
 */
export async function destroyUserSession(request: Request) {
  const session = await getUserSession(request);
  return storage.destroySession(session);
}
