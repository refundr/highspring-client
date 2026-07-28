import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { createPurchase, fetchProducts } from "~/utils/api.server";
import { readSessionUser } from "~/utils/session.server";

export const meta: MetaFunction = () => [{ title: "Shop · Highspring" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await readSessionUser(request);
  if (!user) return redirect("/");
  const products = await fetchProducts(user.sessionId);
  return json({ user, products });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await readSessionUser(request);
  if (!user) return redirect("/");
  const form = await request.formData();
  const items = [];
  for (const [key, value] of form.entries()) {
    if (!key.startsWith("qty-")) continue;
    const quantity = Number(value);
    if (!Number.isFinite(quantity) || quantity <= 0) continue;
    items.push({ productId: key.slice(4), quantity });
  }
  if (items.length === 0) {
    return json({ error: "Add at least one product quantity.", purchase: null }, { status: 400 });
  }
  try {
    const purchase = await createPurchase(user.sessionId, items);
    return json({ error: null, purchase });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Checkout failed", purchase: null },
      { status: 400 }
    );
  }
}

export default function Shop() {
  const { user, products } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <main className="shell">
      <div className="topbar">
        <div className="brand">Highspring</div>
        <div className="nav">
          <span>{user.email}</span>
          {user.role === "ADMIN" ? (
            <Link className="button secondary" to="/admin">
              Admin
            </Link>
          ) : null}
          <Link className="button secondary" to="/?logout=1">
            Sign out
          </Link>
        </div>
      </div>

      <section className="hero">
        <h1>Shop the catalog</h1>
        <p>Quantities are whole numbers. Discounts come from each product’s category, then tax is added.</p>
      </section>

      <Form method="post">
        <div className="grid">
          {products.map((product) => (
            <article className="product" key={product.id}>
              <h3>{product.name}</h3>
              <p className="meta">
                {product.categoryName} · {product.discountPercent}% off · ${Number(product.unitPrice).toFixed(2)}
              </p>
              <div className="row">
                <label>
                  Qty
                  <input
                    className="qty"
                    type="number"
                    min={0}
                    step={1}
                    name={`qty-${product.id}`}
                    defaultValue={0}
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
        <div style={{ marginTop: "1.5rem" }}>
          <button type="submit">Check out</button>
        </div>
      </Form>

      {actionData?.error ? <p className="error">{actionData.error}</p> : null}
      {actionData?.purchase ? (
        <section className="panel totals">
          <h2>Purchase saved</h2>
          <p>Subtotal: ${Number(actionData.purchase.subtotal).toFixed(2)}</p>
          <p>Sales tax: ${Number(actionData.purchase.salesTax).toFixed(2)}</p>
          <p className="success">
            <strong>Total: ${Number(actionData.purchase.total).toFixed(2)}</strong>
          </p>
        </section>
      ) : null}
    </main>
  );
}
