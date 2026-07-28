import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { AppNav } from "~/components/AppNav";
import { checkoutCart, fetchCart, fetchMe } from "~/utils/api.server";
import { commitUserSession, readSessionUser } from "~/utils/session.server";

export const meta: MetaFunction = () => [{ title: "Checkout · Highspring" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await readSessionUser(request);
  if (!user) return redirect("/");

  const me = await fetchMe(user.sessionId);
  const cart = await fetchCart(user.sessionId);
  if (cart.itemCount === 0) {
    return redirect("/shop");
  }

  const headers = new Headers();
  if (me.role !== user.role || me.email !== user.email) {
    headers.set("Set-Cookie", await commitUserSession(me));
  }
  return json({ user: me, cart }, { headers });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await readSessionUser(request);
  if (!user) return redirect("/");

  // Demo payment: pause so the UI can show "Processing…", then always succeed.
  await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    const purchase = await checkoutCart(user.sessionId);
    return redirect(`/checkout/success?id=${purchase.id}`);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Payment could not be completed." },
      { status: 400 }
    );
  }
}

export default function Checkout() {
  const { user, cart } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  return (
    <main className="shell">
      <AppNav user={user} current="shop" cartCount={cart.itemCount} />

      <section className="hero">
        <h1>Checkout</h1>
        <p>Review your order and pay. In this demo, payment always succeeds.</p>
      </section>

      <div className="checkout-layout">
        <section className="panel checkout-summary">
          <h2>Order summary</h2>
          <ul className="cart-lines">
            {cart.items.map((item) => (
              <li className="cart-line" key={item.productId}>
                <img src={item.imageUrl} alt="" className="cart-thumb" />
                <div className="cart-line-body">
                  <strong>{item.productName}</strong>
                  <span className="meta">
                    Qty {item.quantity} · ${Number(item.lineSubtotal).toFixed(2)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <div className="cart-totals">
            <p>Subtotal: ${Number(cart.subtotal).toFixed(2)}</p>
            <p>Sales tax: ${Number(cart.salesTax).toFixed(2)}</p>
            <p className="success">
              <strong>Total due: ${Number(cart.total).toFixed(2)}</strong>
            </p>
          </div>
        </section>

        <section className="panel payment-panel">
          <h2>Payment</h2>
          <p className="meta">
            Card details are for show only — clicking Pay authorizes the charge every time.
          </p>
          <Form method="post" className={`payment-form${busy ? " is-processing" : ""}`}>
            <label>
              Name on card
              <input
                name="cardName"
                type="text"
                defaultValue="Alex Shopper"
                autoComplete="cc-name"
                disabled={busy}
              />
            </label>
            <label>
              Card number
              <input
                name="cardNumber"
                type="text"
                defaultValue="4242 4242 4242 4242"
                autoComplete="cc-number"
                inputMode="numeric"
                disabled={busy}
              />
            </label>
            <div className="payment-row">
              <label>
                Expiry
                <input
                  name="expiry"
                  type="text"
                  defaultValue="12/30"
                  autoComplete="cc-exp"
                  disabled={busy}
                />
              </label>
              <label>
                CVC
                <input
                  name="cvc"
                  type="text"
                  defaultValue="123"
                  autoComplete="cc-csc"
                  disabled={busy}
                />
              </label>
            </div>
            <button type="submit" disabled={busy}>
              {busy ? "Processing payment…" : `Pay $${Number(cart.total).toFixed(2)}`}
            </button>
            {busy ? (
              <p className="payment-status" role="status" aria-live="polite">
                Contacting the payment provider…
              </p>
            ) : null}
          </Form>
          {actionData?.error ? <p className="error">{actionData.error}</p> : null}
          <p style={{ marginTop: "1rem" }}>
            <Link className="button secondary" to="/shop">
              Back to cart
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
