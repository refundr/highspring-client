/**
 * Google OAuth return URL: /auth/callback?code=…
 *
 * Google redirects the browser here after the user consents.
 * We trade `code` for a Highspring Session, store it in the cookie, then go to /shop.
 *
 * Must match the redirect URI registered in Google Cloud Console
 * (and the same value sent when starting the Google auth URL).
 */
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { exchangeCode } from "~/utils/api.server";
import { publicOrigin } from "~/utils/origin.server";
import { commitUserSession } from "~/utils/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    throw new Response("Missing Google authorization code", { status: 400 });
  }
  // Must match the redirect URI used when building the Google auth URL.
  const redirectUri = `${publicOrigin(request)}/auth/callback`;
  const session = await exchangeCode(code, redirectUri);
  const cookie = await commitUserSession(session);
  return redirect("/shop", {
    headers: { "Set-Cookie": cookie },
  });
}

export default function AuthCallback() {
  // Users rarely see this — the loader redirects immediately on success.
  return (
    <p className="mx-auto w-[min(1100px,calc(100%-2rem))] py-6 text-muted">Finishing sign-in…</p>
  );
}
