import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { AppNav } from "~/components/AppNav";
import {
  deleteAdminError,
  deleteAllAdminErrors,
  fetchAdminErrors,
  fetchAdminPurchases,
  fetchAdminTotals,
  type ErrorLog,
} from "~/utils/api.server";
import { readSessionUser } from "~/utils/session.server";

export const meta: MetaFunction = () => [{ title: "Admin · Highspring" }];

type DeleteActionData =
  | { ok: true; deletedId: number; deletedAll?: undefined }
  | { ok: true; deletedAll: true; deletedId?: undefined }
  | { ok: false; error: string };

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

  const boomJustFired = new URL(request.url).searchParams.get("boom") === "1";

  return json({
    user,
    totals,
    purchases,
    errors,
    boomJustFired,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await readSessionUser(request);
  if (!user) return redirect("/");
  if (user.role !== "ADMIN") {
    throw new Response("Admins only", { status: 403 });
  }

  const form = await request.formData();
  const intent = String(form.get("intent") || "");

  try {
    if (intent === "delete-error") {
      const errorId = Number(form.get("errorId"));
      if (!Number.isFinite(errorId)) {
        return json<DeleteActionData>({ ok: false, error: "Invalid error id." }, { status: 400 });
      }
      await deleteAdminError(user.sessionId, errorId);
      return json<DeleteActionData>({ ok: true, deletedId: errorId });
    }

    if (intent === "delete-all-errors") {
      await deleteAllAdminErrors(user.sessionId);
      return json<DeleteActionData>({ ok: true, deletedAll: true });
    }

    return json<DeleteActionData>({ ok: false, error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return json<DeleteActionData>(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not delete error log.",
      },
      { status: 400 }
    );
  }
}

export default function Admin() {
  const { user, totals, purchases, errors: loaderErrors, boomJustFired } =
    useLoaderData<typeof loader>();
  const [errors, setErrors] = useState<ErrorLog[]>(loaderErrors);
  const [actionError, setActionError] = useState<string | null>(null);
  const deleteFetcher = useFetcher<DeleteActionData>();
  const clearFetcher = useFetcher<DeleteActionData>();
  const deleting = deleteFetcher.state !== "idle" || clearFetcher.state !== "idle";
  const pendingDeleteId =
    deleteFetcher.state !== "idle"
      ? Number(deleteFetcher.formData?.get("errorId") || NaN)
      : null;

  useEffect(() => {
    setErrors(loaderErrors);
  }, [loaderErrors]);

  useEffect(() => {
    const data = deleteFetcher.data;
    if (!data) return;
    if (!data.ok) {
      setActionError(data.error);
      return;
    }
    setActionError(null);
    if (typeof data.deletedId === "number") {
      setErrors((current) => current.filter((entry) => entry.id !== data.deletedId));
    }
  }, [deleteFetcher.data]);

  useEffect(() => {
    const data = clearFetcher.data;
    if (!data) return;
    if (!data.ok) {
      setActionError(data.error);
      return;
    }
    setActionError(null);
    if (data.deletedAll) {
      setErrors([]);
    }
  }, [clearFetcher.data]);

  return (
    <main className="shell">
      <AppNav user={user} current="admin" />

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
        <div className="row">
          <div>
            <h2>Server errors (500)</h2>
            <p className="meta" style={{ margin: "0.35rem 0 0" }}>
              Demo endpoint: <code>GET /v1/admin/boom/</code> (requires{" "}
              <code>ENABLE_BOOM_ENDPOINT=true</code>).
            </p>
          </div>
          <div className="nav">
            <Link className="button secondary" to="/admin/boom">
              Trigger demo 500
            </Link>
            {errors.length > 0 ? (
              <clearFetcher.Form method="post">
                <input type="hidden" name="intent" value="delete-all-errors" />
                <button
                  type="submit"
                  className="btn-compact btn-ghost"
                  disabled={deleting}
                  onClick={(event) => {
                    if (!confirm("Delete all saved stack traces?")) {
                      event.preventDefault();
                    }
                  }}
                >
                  {clearFetcher.state !== "idle" ? "Clearing…" : "Clear all"}
                </button>
              </clearFetcher.Form>
            ) : null}
          </div>
        </div>
        {boomJustFired ? (
          <p className="success">
            Demo 500 fired — new row should appear below (and an alert email if SMTP is configured).
          </p>
        ) : null}
        {actionError ? <p className="error">{actionError}</p> : null}
        {errors.length === 0 ? (
          <p className="meta" style={{ marginTop: "1rem" }}>
            No saved stack traces.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Path</th>
                <th>Message</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {errors.map((error) => {
                const rowBusy = pendingDeleteId === error.id;
                return (
                  <tr key={error.id} className={rowBusy ? "is-deleting" : undefined}>
                    <td>{new Date(error.createdAt).toLocaleString()}</td>
                    <td>
                      {error.requestMethod} {error.requestPath}
                    </td>
                    <td>
                      <div>{error.message}</div>
                      <pre className="stack-trace">{error.stackTrace || ""}</pre>
                    </td>
                    <td>
                      <deleteFetcher.Form method="post">
                        <input type="hidden" name="intent" value="delete-error" />
                        <input type="hidden" name="errorId" value={error.id} />
                        <button type="submit" className="btn-compact btn-ghost" disabled={deleting}>
                          {rowBusy ? "Deleting…" : "Delete"}
                        </button>
                      </deleteFetcher.Form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
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
