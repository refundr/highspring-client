import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { AppNav } from "~/components/AppNav";
import { fetchMe, fetchPurchase } from "~/utils/api.server";
import { commitUserSession, readSessionUser } from "~/utils/session.server";

export const meta: MetaFunction = () => [{ title: "Payment successful · Highspring" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await readSessionUser(request);
  if (!user) return redirect("/");

  const url = new URL(request.url);
  const purchaseId = url.searchParams.get("id");
  if (!purchaseId) {
    return redirect("/shop");
  }

  const me = await fetchMe(user.sessionId);
  let purchase;
  try {
    purchase = await fetchPurchase(user.sessionId, purchaseId);
  } catch {
    return redirect("/shop");
  }

  const headers = new Headers();
  if (me.role !== user.role || me.email !== user.email) {
    headers.set("Set-Cookie", await commitUserSession(me));
  }
  return json({ user: me, purchase }, { headers });
}

export default function CheckoutSuccess() {
  const { user, purchase } = useLoaderData<typeof loader>();

  return (
    <main className="shell">
      <AppNav user={user} current="shop" cartCount={0} />

      <section className="hero success-hero">
        <p className="success-eyebrow">Payment successful</p>
        <h1>Thanks — your order is confirmed</h1>
        <p>
          Payment was approved and your purchase has been saved. You can keep shopping or review
          the totals below.
        </p>
      </section>

      <section className="panel totals success-panel">
        <h2>Order #{purchase.id.slice(0, 8)}</h2>
        <ul className="cart-lines">
          {purchase.items.map((item) => (
            <li key={`${item.productId}-${item.productName}`}>
              <strong>{item.productName}</strong>
              <span className="meta">
                {" "}
                · Qty {item.quantity} · ${Number(item.lineSubtotal).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
        <div className="cart-totals">
          <p>Subtotal: ${Number(purchase.subtotal).toFixed(2)}</p>
          <p>Sales tax: ${Number(purchase.salesTax).toFixed(2)}</p>
          <p className="success">
            <strong>Paid: ${Number(purchase.total).toFixed(2)}</strong>
          </p>
        </div>
        <p style={{ marginTop: "1.25rem" }}>
          <Link className="button" to="/shop">
            Continue shopping
          </Link>
        </p>
      </section>
    </main>
  );
}
