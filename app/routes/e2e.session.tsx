/**
 * Gated E2E helper: POST /e2e/session
 *
 * Playwright calls this after creating an API session via POST /v1/auth/e2e/login/.
 * Sets the Remix `__highspring` cookie so the browser is signed in.
 *
 * Disabled unless `E2E_LOGIN_SECRET` is set and matches header `x-e2e-secret`.
 */
import type {ActionFunctionArgs} from "@remix-run/node";
import {redirect} from "@remix-run/node";
import type {Session} from "~/utils/api.server";
import {commitUserSession} from "~/utils/session.server";

export async function action({request}: ActionFunctionArgs) {
    const expected = process.env.E2E_LOGIN_SECRET;
    if (!expected || request.headers.get("x-e2e-secret") !== expected) {
        throw new Response("Not found", {status: 404});
    }
    if (request.method !== "POST") {
        throw new Response("Method not allowed", {status: 405});
    }

    const body = (await request.json()) as Partial<Session>;
    if (!body.sessionId || !body.userId || !body.email || !body.role) {
        throw new Response("Invalid session payload", {status: 400});
    }

    const session: Session = {
        sessionId: body.sessionId,
        userId: body.userId,
        email: body.email,
        displayName: body.displayName ?? null,
        role: body.role,
    };

    return redirect("/shop", {
        headers: {
            "Set-Cookie": await commitUserSession(session),
        },
    });
}

export async function loader() {
    throw new Response("Not found", {status: 404});
}
