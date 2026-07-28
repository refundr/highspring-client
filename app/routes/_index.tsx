import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { getAuthUrl } from "~/utils/api.server";
import { destroyUserSession, readSessionUser } from "~/utils/session.server";

export const meta: MetaFunction = () => [{ title: "Highspring" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  if (url.searchParams.get("logout") === "1") {
    return redirect("/", {
      headers: {
        "Set-Cookie": await destroyUserSession(request),
      },
    });
  }

  const user = await readSessionUser(request);
  if (user) {
    return redirect(user.role === "ADMIN" ? "/admin" : "/shop");
  }

  const redirectUri = `${url.origin}/auth/callback`;
  const { uri } = await getAuthUrl(redirectUri, "highspring");
  return json({ googleUrl: uri });
}

export default function Index() {
  const { googleUrl } = useLoaderData<typeof loader>();

  return (
    <main className="shell">
      <div className="topbar">
        <div className="brand">Highspring</div>
      </div>
      <section className="hero">
        <h1>A calm storefront for a carefully priced cart.</h1>
        <p>
          Sign in with Google, pick products from the catalog, and check out with
          category discounts applied before sales tax.
        </p>
        <div className="nav">
          <a className="button" href={googleUrl}>
            Continue with Google
          </a>
        </div>
      </section>
    </main>
  );
}
