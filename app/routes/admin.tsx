import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import {
  fetchAdminErrors,
  fetchAdminPurchases,
  fetchAdminTotals,
} from "~/utils/api.server";
import { readSessionUser } from "~/utils/session.server";

export const meta: MetaFunction = () => [{ title: "Admin · Highspring" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await readSessionUser(request);
  if (!user) return redirect("/");
  if (user.role !== "ADMIN") {
    throw new Response("Admins only", { status: 403 });
  }

  const [totals, purchases, errors] = await Promise.all([
    fetchAdminTotals(user.sessionId),
    fetchAdminPurchases(user.sessionId),
    fetchAdminErrors(user.sessionId),
  ]);

  return json({
    user,
    totals,
    purchases,
    errors,
  });
}

export default function Admin() {
  const { user, totals, purchases, errors } = useLoaderData<typeof loader>();

  return (
    <main className="shell">
      <div className="topbar">
        <div className="brand">Highspring</div>
        <div className="nav">
          <span>{user.email} · ADMIN</span>
          <Link className="button secondary" to="/shop">
            Shop
          </Link>
          <Link className="button secondary" to="/?logout=1">
            Sign out
          </Link>
        </div>
      </div>

      <section className="hero">
        <h1>Admin dashboard</h1>
        <p>Sales totals, recent purchases, saved 500 errors, and the Allure test report.</p>
      </section>

      <div className="grid">
        <div className="panel">
          <p>Purchases</p>
          <div className="kpi">{totals.purchaseCount}</div>
        </div>
        <div className="panel">
          <p>Revenue</p>
          <div className="kpi">${Number(totals.totalRevenue).toFixed(2)}</div>
        </div>
        <div className="panel">
          <p>Tax collected</p>
          <div className="kpi">${Number(totals.totalTaxCollected).toFixed(2)}</div>
        </div>
      </div>

      <section className="panel" style={{ marginTop: "1.5rem" }}>
        <h2>Recent purchases</h2>
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Subtotal</th>
              <th>Tax</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase) => (
              <tr key={purchase.id}>
                <td>{new Date(purchase.createdAt).toLocaleString()}</td>
                <td>${Number(purchase.subtotal).toFixed(2)}</td>
                <td>${Number(purchase.salesTax).toFixed(2)}</td>
                <td>${Number(purchase.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel" style={{ marginTop: "1.5rem" }}>
        <h2>Server errors (500)</h2>
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Path</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((error) => (
              <tr key={error.id}>
                <td>{new Date(error.createdAt).toLocaleString()}</td>
                <td>
                  {error.requestMethod} {error.requestPath}
                </td>
                <td>
                  <div>{error.message}</div>
                  <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.8rem" }}>
                    {(error.stackTrace || "").slice(0, 500)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel" style={{ marginTop: "1.5rem" }}>
        <div className="row">
          <h2>Allure test report</h2>
          <a className="button secondary" href="/admin/allure/index.html" target="_blank" rel="noreferrer">
            Open report
          </a>
        </div>
        <p style={{ margin: "0.75rem 0 1rem" }}>
          Published after `mvn test allure:report` (or `mvn verify`). Only ADMIN sessions can load it.
        </p>
        <iframe
          className="iframe"
          title="Allure report"
          src="/admin/allure/index.html"
        />
        <p className="meta" style={{ marginTop: "0.75rem" }}>
          Tip: open <Link to="/admin/allure/index.html">/admin/allure</Link> for a full-page view
          proxied with your admin session.
        </p>
      </section>
    </main>
  );
}
