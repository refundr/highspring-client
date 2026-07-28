import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { AppNav } from "~/components/AppNav";
import {
  addCartItem,
  fetchCart,
  fetchMe,
  fetchProducts,
  setCartItemQuantity,
  type Cart,
  type Product,
} from "~/utils/api.server";
import { commitUserSession, readSessionUser } from "~/utils/session.server";

export const meta: MetaFunction = () => [{ title: "Shop · Highspring" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await readSessionUser(request);
  if (!user) return redirect("/");

  const me = await fetchMe(user.sessionId);
  const [products, cart] = await Promise.all([
    fetchProducts(user.sessionId),
    fetchCart(user.sessionId),
  ]);
  const headers = new Headers();
  if (me.role !== user.role || me.email !== user.email) {
    headers.set("Set-Cookie", await commitUserSession(me));
  }
  return json({ user: me, products, cart }, { headers });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await readSessionUser(request);
  if (!user) return redirect("/");
  const form = await request.formData();
  const intent = String(form.get("intent") || "");

  try {
    if (intent === "add") {
      const productId = String(form.get("productId") || "");
      const quantity = Number(form.get("quantity") || 0);
      if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
        return json({ error: "Choose a quantity of at least 1.", cart: null }, { status: 400 });
      }
      const cart = await addCartItem(user.sessionId, productId, quantity);
      return json({ error: null, cart });
    }

    if (intent === "set") {
      const productId = String(form.get("productId") || "");
      const quantity = Number(form.get("quantity") || 0);
      if (!productId || !Number.isFinite(quantity) || quantity < 0) {
        return json({ error: "Invalid cart quantity.", cart: null }, { status: 400 });
      }
      const cart = await setCartItemQuantity(user.sessionId, productId, quantity);
      return json({ error: null, cart });
    }

    if (intent === "remove") {
      const productId = String(form.get("productId") || "");
      const cart = await setCartItemQuantity(user.sessionId, productId, 0);
      return json({ error: null, cart });
    }

    return json({ error: "Unknown action.", cart: null }, { status: 400 });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Cart update failed",
        cart: null,
      },
      { status: 400 }
    );
  }
}

export default function Shop() {
  const { user, products, cart: loaderCart } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const cart: Cart = actionData?.cart ?? loaderCart;
  const busy = navigation.state !== "idle";

  return (
    <main className="shell">
      <AppNav user={user} current="shop" cartCount={cart.itemCount} />

      <section className="hero">
        <h1>Shop the catalog</h1>
        <p>
          Add items to your cart — quantities are saved on the server, so you can leave and come
          back later to check out.
        </p>
      </section>

      <div className="shop-layout">
        <section aria-label="Catalog">
          <div className="grid">
            {products.map((product: Product) => (
              <article className="product" key={product.id}>
                <div className="product-media">
                  <img src={product.imageUrl} alt={product.name} loading="lazy" />
                </div>
                <h3>{product.name}</h3>
                <p className="meta">
                  {product.categoryName} · {Number(product.discountPercent)}% off · $
                  {Number(product.unitPrice).toFixed(2)}
                </p>
                <Form method="post" className="product-actions">
                  <input type="hidden" name="intent" value="add" />
                  <input type="hidden" name="productId" value={product.id} />
                  <label>
                    Qty
                    <input
                      className="qty"
                      type="number"
                      name="quantity"
                      min={1}
                      step={1}
                      defaultValue={1}
                      required
                    />
                  </label>
                  <button type="submit" disabled={busy}>
                    Add to cart
                  </button>
                </Form>
              </article>
            ))}
          </div>
        </section>

        <aside className="cart-panel" id="cart" aria-label="Shopping cart">
          <div className="cart-header">
            <h2>Your cart</h2>
            <p>
              {cart.itemCount === 0
                ? "Empty — add something from the catalog."
                : `${cart.itemCount} item${cart.itemCount === 1 ? "" : "s"} saved`}
            </p>
          </div>

          {cart.items.length > 0 ? (
            <ul className="cart-lines">
              {cart.items.map((item) => (
                <li className="cart-line" key={item.productId}>
                  <img src={item.imageUrl} alt="" className="cart-thumb" />
                  <div className="cart-line-body">
                    <strong>{item.productName}</strong>
                    <span className="meta">
                      ${Number(item.unitPrice).toFixed(2)} · {Number(item.discountPercent)}% off
                    </span>
                    <div className="cart-line-actions">
                      <Form method="post" className="cart-qty-form">
                        <input type="hidden" name="intent" value="set" />
                        <input type="hidden" name="productId" value={item.productId} />
                        <label className="cart-qty-label">
                          <span className="visually-hidden">Quantity</span>
                          <input
                            className="qty"
                            type="number"
                            name="quantity"
                            min={1}
                            step={1}
                            defaultValue={item.quantity}
                            key={`${item.productId}-${item.quantity}`}
                            aria-label="Quantity"
                          />
                        </label>
                        <button type="submit" className="btn-compact" disabled={busy}>
                          Update
                        </button>
                      </Form>
                      <Form method="post">
                        <input type="hidden" name="intent" value="remove" />
                        <input type="hidden" name="productId" value={item.productId} />
                        <button type="submit" className="btn-compact btn-ghost" disabled={busy}>
                          Remove
                        </button>
                      </Form>
                    </div>
                    <span className="line-total">${Number(item.lineSubtotal).toFixed(2)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {cart.items.length > 0 ? (
            <div className="cart-totals">
              <p>Subtotal: ${Number(cart.subtotal).toFixed(2)}</p>
              <p>Sales tax: ${Number(cart.salesTax).toFixed(2)}</p>
              <p className="success">
                <strong>Total: ${Number(cart.total).toFixed(2)}</strong>
              </p>
              <Link className="button" to="/checkout">
                Check out
              </Link>
            </div>
          ) : null}
        </aside>
      </div>

      {actionData?.error ? <p className="error">{actionData.error}</p> : null}
    </main>
  );
}
