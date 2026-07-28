import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { exchangeCode } from "~/utils/api.server";
import { commitUserSession } from "~/utils/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    throw new Response("Missing Google authorization code", { status: 400 });
  }
  const redirectUri = `${url.origin}/auth/callback`;
  const session = await exchangeCode(code, redirectUri);
  const cookie = await commitUserSession(session);
  return redirect(session.role === "ADMIN" ? "/admin" : "/shop", {
    headers: { "Set-Cookie": cookie },
  });
}

export default function AuthCallback() {
  return <p className="shell">Finishing sign-in…</p>;
}
