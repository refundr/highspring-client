/**
 * Home page `/`.
 *
 * Three modes:
 * 1. ?thanks=1 — post-checkout thank-you (even if signed in; we skip the /shop redirect)
 * 2. Signed in — redirect to /shop (the real “app home”)
 * 3. Signed out — marketing hero + “Continue with Google”
 */
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { AppNav } from "~/components/AppNav";
import { fetchMe, getAuthUrl } from "~/utils/api.server";
import { commitUserSession, readSessionUser } from "~/utils/session.server";
import { brand, btn, heading, hero, muted, shell } from "~/utils/ui";

export const meta: MetaFunction = () => [{ title: "Highspring" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const thanks = url.searchParams.get("thanks") === "1";
  const purchaseId = url.searchParams.get("id");
  const user = await readSessionUser(request);

  if (thanks) {
    if (user) {
      // Refresh role/email from the API in case ADMIN_EMAILS changed.
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
  // "highspring" is a simple OAuth state placeholder (not cryptographically verified yet).
  const { uri } = await getAuthUrl(redirectUri, "highspring");
  return json({ thanks: false as const, user: null, purchaseId: null, googleUrl: uri });
}

export default function Index() {
  const data = useLoaderData<typeof loader>();

  if (data.thanks) {
    return (
      <main className={shell}>
        {data.user ? (
          <AppNav user={data.user} current="home" cartCount={0} />
        ) : (
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link className={brand} to="/" aria-label="Highspring home">
              Highspring
            </Link>
          </div>
        )}

        <section className={hero}>
          <p className="text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-leaf-dark">
            Thank you
          </p>
          <h1 className={`${heading} text-leaf-dark`}>Your payment went through</h1>
          <p className={`${muted} max-w-xl text-[1.1rem]`}>
            We appreciate your order
            {data.purchaseId ? <> (#{data.purchaseId.slice(0, 8)})</> : null}. Check your email for
            shipping details and next steps.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className={btn} to="/shop">
              Continue shopping
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={shell}>
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link className={brand} to="/" aria-label="Highspring home">
          Highspring
        </Link>
      </div>
      <section className={hero}>
        <h1 className={heading}>A calm storefront for a carefully priced cart.</h1>
        <p className={`${muted} max-w-xl text-[1.1rem]`}>
          Sign in with Google, pick products from the catalog, and check out with category discounts
          applied before sales tax.
        </p>
        <div className="flex flex-wrap gap-3">
          <a className={btn} href={data.googleUrl!}>
            Continue with Google
          </a>
        </div>
      </section>
    </main>
  );
}
