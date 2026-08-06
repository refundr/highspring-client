/**
 * Checkout `/checkout` — review cart + fake card form.
 *
 * DEMO ONLY: the action waits 3 seconds (so the UI can show “Processing…”),
 * then calls POST /v1/cart/checkout/. There is no real payment provider.
 * Card fields are ignored by the server action; do not collect real PANs in production.
 *
 * On success we redirect to `/?thanks=1&id={purchaseId}`.
 */
import type {ActionFunctionArgs, LoaderFunctionArgs, MetaFunction} from "@remix-run/node";
import {json, redirect} from "@remix-run/node";
import {Form, Link, useActionData, useLoaderData, useNavigation} from "@remix-run/react";
import {AppNav} from "~/components/AppNav";
import {checkoutCart, fetchCart, fetchMe} from "~/utils/api.server";
import {commitUserSession, readSessionUser} from "~/utils/session.server";
import {btn, btnSecondary, heading, hero, input, muted, panel, priceInline, priceSm, priceTotal, shell,} from "~/utils/ui";

export const meta: MetaFunction = () => [{title: "Checkout · Highspring"}];

export async function loader({request}: LoaderFunctionArgs) {
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
    return json({user: me, cart}, {headers});
}

export async function action({request}: ActionFunctionArgs) {
    const user = await readSessionUser(request);
    if (!user) return redirect("/");

    // Demo payment: pause so the UI can show "Processing…", then always succeed.
    await new Promise((resolve) => setTimeout(resolve, 3000));

    try {
        const purchase = await checkoutCart(user.sessionId);
        return redirect(`/?thanks=1&id=${purchase.id}`);
    } catch (error) {
        return json(
            {error: error instanceof Error ? error.message : "Payment could not be completed."},
            {status: 400}
        );
    }
}

export default function Checkout() {
    const {user, cart} = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const busy = navigation.state !== "idle";

    return (
        <main className={shell}>
            <AppNav user={user} current="shop" cartCount={cart.itemCount}/>

            <section className={hero}>
                <h1 className={heading}>Checkout</h1>
                <p className={`${muted} max-w-xl text-[1.1rem]`}>
                    Review your order and pay. In this demo, payment always succeeds.
                </p>
            </section>

            <div className="grid items-start gap-6 max-md:grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
                <section className={panel}>
                    <h2 className="mb-3">Order summary</h2>
                    <ul className="m-0 grid list-none gap-4 p-0">
                        {cart.items.map((item) => (
                            <li className="grid grid-cols-[72px_1fr] items-start gap-[0.85rem]" key={item.productId}>
                                <img
                                    src={item.imageUrl}
                                    alt=""
                                    className="h-[72px] w-[72px] rounded-[0.85rem] bg-ink/5 object-cover"
                                />
                                <div className="grid gap-[0.35rem]">
                                    <strong>{item.productName}</strong>
                                    <span className="text-[0.95rem] text-muted">Qty {item.quantity}</span>
                                    <span className={priceSm}>${Number(item.lineSubtotal).toFixed(2)}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 grid gap-[0.35rem] border-t border-line pt-2">
                        <p className={muted}>
                            Subtotal: <span className={priceInline}>${Number(cart.subtotal).toFixed(2)}</span>
                        </p>
                        <p className={muted}>
                            Sales tax: <span className={priceInline}>${Number(cart.salesTax).toFixed(2)}</span>
                        </p>
                        <p className="mt-[0.35rem] flex items-baseline justify-between gap-3 text-[1.05rem] font-semibold text-ink">
                            Total due:{" "}
                            <span className={priceTotal}>
                ${Number(cart.total).toFixed(2)}
              </span>
                        </p>
                    </div>
                </section>

                <section className={panel}>
                    <h2>Payment</h2>
                    <p className={`${muted} mt-[0.35rem]`}>
                        Card details are for show only — clicking Pay authorizes the charge every time.
                    </p>
                    <Form
                        method="post"
                        className={`mt-4 grid gap-[0.85rem]${busy ? " opacity-[0.92]" : ""}`}
                    >
                        <label className="grid gap-[0.35rem] text-[0.95rem] text-muted">
                            Name on card
                            <input
                                className={input}
                                name="cardName"
                                type="text"
                                defaultValue="Alex Shopper"
                                autoComplete="cc-name"
                                disabled={busy}
                            />
                        </label>
                        <label className="grid gap-[0.35rem] text-[0.95rem] text-muted">
                            Card number
                            <input
                                className={input}
                                name="cardNumber"
                                type="text"
                                defaultValue="4242 4242 4242 4242"
                                autoComplete="cc-number"
                                inputMode="numeric"
                                disabled={busy}
                            />
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="grid gap-[0.35rem] text-[0.95rem] text-muted">
                                Expiry
                                <input
                                    className={input}
                                    name="expiry"
                                    type="text"
                                    defaultValue="12/30"
                                    autoComplete="cc-exp"
                                    disabled={busy}
                                />
                            </label>
                            <label className="grid gap-[0.35rem] text-[0.95rem] text-muted">
                                CVC
                                <input
                                    className={input}
                                    name="cvc"
                                    type="text"
                                    defaultValue="123"
                                    autoComplete="cc-csc"
                                    disabled={busy}
                                />
                            </label>
                        </div>
                        <button type="submit" className={btn} disabled={busy}>
                            {busy ? "Processing payment…" : `Pay $${Number(cart.total).toFixed(2)}`}
                        </button>
                        {busy ? (
                            <p className="text-[0.95rem] font-semibold text-leaf-dark" role="status" aria-live="polite">
                                Contacting the payment provider…
                            </p>
                        ) : null}
                    </Form>
                    {actionData?.error ? <p className="mt-3 text-[#8a2b1c]">{actionData.error}</p> : null}
                    <p className="mt-4">
                        <Link className={btnSecondary} to="/shop">
                            Back to cart
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    );
}
