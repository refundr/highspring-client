/**
 * Shop page `/shop` — catalog + sticky cart.
 *
 * Remix data flow:
 * - `loader` runs on GET: must be signed in; loads products + cart from the API
 * - `action` runs on form POST: add / set quantity / remove cart lines
 * - The default export reads loader + action data and renders HTML
 *
 * Cart state lives on the **server** (Postgres). After a successful action we
 * prefer `actionData.cart` so the UI updates without waiting for a full reload.
 */
import type {ActionFunctionArgs, LoaderFunctionArgs, MetaFunction} from "@remix-run/node";
import {json, redirect} from "@remix-run/node";
import {Form, Link, useActionData, useLoaderData, useNavigation} from "@remix-run/react";
import {AppNav} from "~/components/AppNav";
import {addCartItem, type Cart, fetchCart, fetchMe, fetchProducts, type Product, setCartItemQuantity,} from "~/utils/api.server";
import {commitUserSession, readSessionUser} from "~/utils/session.server";
import {btn, btnCompact, btnGhost, heading, hero, muted, price, priceInline, priceSm, priceTotal, qty, shell,} from "~/utils/ui";

export const meta: MetaFunction = () => [{title: "Shop · Highspring"}];

export async function loader({request}: LoaderFunctionArgs) {
    const user = await readSessionUser(request);
    if (!user) return redirect("/");

    const me = await fetchMe(user.sessionId);
    const [products, cart] = await Promise.all([
        fetchProducts(user.sessionId),
        fetchCart(user.sessionId),
    ]);

    const headers = new Headers();

    // this is a bit of a hack to avoid a full page reload when the user signs out
    // this makes sure the email and role are updated in the session cookie
    if (me.role !== user.role || me.email !== user.email) {
        headers.set("Set-Cookie", await commitUserSession(me));
    }

    return json({user: me, products, cart}, {headers});
}

export async function action({request}: ActionFunctionArgs) {
    const user = await readSessionUser(request);
    if (!user) return redirect("/");
    const form = await request.formData();
    const intent = String(form.get("intent") || "");

    try {
        if (intent === "add") {
            const productId = String(form.get("productId") || "");
            const quantity = Number(form.get("quantity") || 0);
            if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
                return json({error: "Choose a quantity of at least 1.", cart: null}, {status: 400});
            }
            const cart = await addCartItem(user.sessionId, productId, quantity);
            return json({error: null, cart});
        }

        if (intent === "set") {
            const productId = String(form.get("productId") || "");
            const quantity = Number(form.get("quantity") || 0);
            if (!productId || !Number.isFinite(quantity) || quantity < 0) {
                return json({error: "Invalid cart quantity.", cart: null}, {status: 400});
            }
            const cart = await setCartItemQuantity(user.sessionId, productId, quantity);
            return json({error: null, cart});
        }

        if (intent === "remove") {
            const productId = String(form.get("productId") || "");
            const cart = await setCartItemQuantity(user.sessionId, productId, 0);
            return json({error: null, cart});
        }

        return json({error: "Unknown action.", cart: null}, {status: 400});
    } catch (error) {
        return json(
            {
                error: error instanceof Error ? error.message : "Cart update failed",
                cart: null,
            },
            {status: 400}
        );
    }
}

export default function Shop() {
    const {user, products, cart: loaderCart} = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const cart: Cart = actionData?.cart ?? loaderCart;
    const busy = navigation.state !== "idle";

    return (
        <main className={shell}>
            <AppNav user={user} current="shop" cartCount={cart.itemCount}/>

            <section className={hero}>
                <h1 className={heading}>Shop the catalog</h1>
                <p className={`${muted} max-w-xl text-[1.1rem]`}>
                    Add items to your cart — quantities are saved on the server, so you can leave and come
                    back later to check out.
                </p>
            </section>

            <div className="grid items-start gap-6 max-md:grid-cols-1 md:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
                <section aria-label="Catalog">
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
                        {products.map((product: Product) => (
                            <article
                                className="grid gap-3 overflow-hidden rounded-[1.25rem] border border-line bg-card p-0 shadow-card backdrop-blur-[10px]"
                                key={product.id}
                            >
                                <div className="aspect-square overflow-hidden bg-ink/5">
                                    <img
                                        className="block h-full w-full object-cover"
                                        src={product.imageUrl}
                                        alt={product.name}
                                        loading="lazy"
                                    />
                                </div>
                                <h3 className="m-0 px-5 pt-[0.15rem] text-[1.25rem]">{product.name}</h3>
                                <p className="m-0 px-5 text-[0.95rem] text-muted">
                                    {product.categoryName} · {Number(product.discountPercent)}% off
                                </p>
                                <p className={`${price} px-5`}>${Number(product.unitPrice).toFixed(2)}</p>
                                <Form method="post" className="flex flex-wrap items-end gap-3 px-5 pb-5">
                                    <input type="hidden" name="intent" value="add"/>
                                    <input type="hidden" name="productId" value={product.id}/>
                                    <label className="grid gap-[0.35rem] text-[0.95rem] text-muted">
                                        Qty
                                        <input
                                            className={qty}
                                            type="number"
                                            name="quantity"
                                            min={1}
                                            step={1}
                                            defaultValue={1}
                                            required
                                        />
                                    </label>
                                    <button type="submit" className={btn} disabled={busy}>
                                        Add to cart
                                    </button>
                                </Form>
                            </article>
                        ))}
                    </div>
                </section>

                <aside
                    className="sticky top-4 grid gap-4 rounded-[1.25rem] border border-line bg-card p-5 shadow-card backdrop-blur-[10px] max-md:static"
                    id="cart"
                    aria-label="Shopping cart"
                >
                    <div>
                        <h2 className="mb-1 text-[1.4rem]">Your cart</h2>
                        <p className={muted}>
                            {cart.itemCount === 0
                                ? "Empty — add something from the catalog."
                                : `${cart.itemCount} item${cart.itemCount === 1 ? "" : "s"} saved`}
                        </p>
                    </div>

                    {cart.items.length > 0 ? (
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
                                        <span className="text-[0.95rem] text-muted">
                      {Number(item.discountPercent)}% off
                    </span>
                                        <div className="flex items-baseline justify-between gap-3">
                      <span className={priceSm}>
                        ${Number(item.unitPrice).toFixed(2)}
                          <span className="font-sans text-[0.75em] font-semibold tracking-normal text-muted">
                          {" "}
                              each
                        </span>
                      </span>
                                            <span className={`${priceSm} font-bold`}>
                        ${Number(item.lineSubtotal).toFixed(2)}
                      </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-[0.4rem]">
                                            <Form method="post" className="inline-flex min-w-0 items-center gap-[0.35rem]">
                                                <input type="hidden" name="intent" value="set"/>
                                                <input type="hidden" name="productId" value={item.productId}/>
                                                <label className="m-0 inline-flex">
                                                    <span className="sr-only">Quantity</span>
                                                    <input
                                                        className="w-[3.25rem] rounded-lg border border-line bg-white px-[0.4rem] py-[0.3rem] font-sans text-[0.9rem] text-ink"
                                                        type="number"
                                                        name="quantity"
                                                        min={1}
                                                        step={1}
                                                        defaultValue={item.quantity}
                                                        key={`${item.productId}-${item.quantity}`}
                                                        aria-label="Quantity"
                                                    />
                                                </label>
                                                <button type="submit" className={btnCompact} disabled={busy}>
                                                    Update
                                                </button>
                                            </Form>
                                            <Form method="post">
                                                <input type="hidden" name="intent" value="remove"/>
                                                <input type="hidden" name="productId" value={item.productId}/>
                                                <button type="submit" className={btnGhost} disabled={busy}>
                                                    Remove
                                                </button>
                                            </Form>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : null}

                    {cart.items.length > 0 ? (
                        <div className="grid gap-[0.35rem] border-t border-line pt-2">
                            <p className={muted}>
                                Subtotal:{" "}
                                <span className={priceInline}>${Number(cart.subtotal).toFixed(2)}</span>
                            </p>
                            <p className={muted}>
                                Sales tax:{" "}
                                <span className={priceInline}>${Number(cart.salesTax).toFixed(2)}</span>
                            </p>
                            <p className="mt-[0.35rem] flex items-baseline justify-between gap-3 text-[1.05rem] font-semibold text-ink">
                                Total:{" "}
                                <span className={priceTotal}>
                  ${Number(cart.total).toFixed(2)}
                </span>
                            </p>
                            <Link className={btn} to="/checkout">
                                Check out
                            </Link>
                        </div>
                    ) : null}
                </aside>
            </div>

            {actionData?.error ? <p className="mt-3 text-[#8a2b1c]">{actionData.error}</p> : null}
        </main>
    );
}
