/**
 *
 * A route action is a server-only function to handle data mutations and other actions.
 * If a non-GET request is made to your route (DELETE, PATCH, POST, or PUT) then the action is called before the loaders.
 *
 * POST /logout — end the login on both layers.
 *
 * 1. DELETE /v1/auth/logout/ → API deletes the api_session row (token stops working)
 * 2. Clear the Remix __highspring cookie
 *
 * Using POST (not GET /?logout=1) avoids drive-by logout CSRF via a simple link or image.
 */
import type {ActionFunctionArgs} from "@remix-run/node";
import {redirect} from "@remix-run/node";
import {logoutSession} from "~/utils/api.server";
import {destroyUserSession, readSessionUser} from "~/utils/session.server";

export async function action({request}: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return redirect("/");
    }

    const user = await readSessionUser(request);
    if (user) {
        await logoutSession(user.sessionId);
    }

    return redirect("/", {
        headers: {
            "Set-Cookie": await destroyUserSession(request),
        },
    });
}

/** Accidental GET /logout just sends you home. */
export async function loader() {
    return redirect("/");
}
