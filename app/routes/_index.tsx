import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { AppNav } from "~/components/AppNav";
import { fetchMe, getAuthUrl } from "~/utils/api.server";
import { commitUserSession, destroyUserSession, readSessionUser } from "~/utils/session.server";

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

  const thanks = url.searchParams.get("thanks") === "1";
  const purchaseId = url.searchParams.get("id");
  const user = await readSessionUser(request);

  if (thanks) {
    if (user) {
      const me = await fetchMe(user.sessionId);
      const headers = new Headers();
      if (me.role !== user.role || me.email !== user.email) {
        headers.set("Set-Cookie", await commitUserSession(me));
      }
      return json(
        { thanks: true as const, user: me, purchaseId, googleUrl: null },
        { headers }
      );
    }
    return json({ thanks: true as const, user: null, purchaseId, googleUrl: null });
  }

  if (user) {
    return redirect("/shop");
  }

  const redirectUri = `${url.origin}/auth/callback`;
  const { uri } = await getAuthUrl(redirectUri, "highspring");
  return json({ thanks: false as const, user: null, purchaseId: null, googleUrl: uri });
}

export default function Index() {
  const data = useLoaderData<typeof loader>();

  if (data.thanks) {
    return (
      <main className="shell">
        {data.user ? (
          <AppNav user={data.user} current="home" cartCount={0} />
        ) : (
          <div className="topbar">
            <Link className="brand" to="/" aria-label="Highspring home">
              Highspring
            </Link>
          </div>
        )}

        <section className="hero success-hero">
          <p className="success-eyebrow">Thank you</p>
          <h1>Your payment went through</h1>
          <p>
            We appreciate your order
            {data.purchaseId ? <> (#{data.purchaseId.slice(0, 8)})</> : null}. Check your email
            for shipping details and next steps.
          </p>
          <div className="nav" style={{ marginTop: "1.25rem" }}>
            <Link className="button" to="/shop">
              Continue shopping
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <div className="topbar">
        <Link className="brand" to="/" aria-label="Highspring home">
          Highspring
        </Link>
      </div>
      <section className="hero">
        <h1>A calm storefront for a carefully priced cart.</h1>
        <p>
          Sign in with Google, pick products from the catalog, and check out with category discounts
          applied before sales tax.
        </p>
        <div className="nav">
          <a className="button" href={data.googleUrl!}>
            Continue with Google
          </a>
        </div>
      </section>
    </main>
  );
}
