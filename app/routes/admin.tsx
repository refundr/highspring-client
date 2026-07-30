/**
 * Admin dashboard `/admin` — ADMIN role only.
 *
 * Sections (top → bottom):
 * KPIs → purchases → 500 error log → Allure → Playwright → Javadoc → client storage
 *
 * Delete buttons use `useFetcher` so the table updates without a full page reload.
 * The cookie role check is UX; the API returns 403 if a customer hits /v1/admin/*.
 */
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
import {
  btnCompact,
  btnGhost,
  btnSecondary,
  code,
  heading,
  hero,
  muted,
  panel,
  shell,
  table,
} from "~/utils/ui";

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
    if ("deletedId" in data && typeof data.deletedId === "number") {
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
    if ("deletedAll" in data && data.deletedAll) {
      setErrors([]);
    }
  }, [clearFetcher.data]);

  return (
    <main className={shell}>
      <AppNav user={user} current="admin" />

      <section className={hero}>
        <h1 className={heading}>Admin dashboard</h1>
        <p className={`${muted} max-w-xl text-[1.1rem]`}>
          Sales totals, recent purchases, API docs, saved 500 errors, and the Allure test report.
        </p>
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        <div className={panel}>
          <p className={muted}>Purchases</p>
          <div className="font-display text-[1.8rem] text-ink">{totals.purchaseCount}</div>
        </div>
        <div className={panel}>
          <p className={muted}>Revenue</p>
          <div className="font-display text-[1.8rem] text-ink">
            ${Number(totals.totalRevenue).toFixed(2)}
          </div>
        </div>
        <div className={panel}>
          <p className={muted}>Tax collected</p>
          <div className="font-display text-[1.8rem] text-ink">
            ${Number(totals.totalTaxCollected).toFixed(2)}
          </div>
        </div>
      </div>

      <section className={`${panel} mt-6`}>
        <h2>Recent purchases</h2>
        <table className={table}>
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

      <section className={`${panel} mt-6 min-w-0 overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2>Server errors (500)</h2>
            <p className={`${muted} mt-[0.35rem]`}>
              Demo endpoint: <code className={code}>GET /v1/admin/boom/</code> (requires{" "}
              <code className={code}>ENABLE_BOOM_ENDPOINT=true</code>).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link className={btnSecondary} to="/admin/boom">
              Trigger demo 500
            </Link>
            {errors.length > 0 ? (
              <clearFetcher.Form method="post">
                <input type="hidden" name="intent" value="delete-all-errors" />
                <button
                  type="submit"
                  className={btnGhost}
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
          <p className="mt-3 text-leaf-dark">
            Demo 500 fired — new row should appear below (and an alert email if SMTP is configured).
          </p>
        ) : null}
        {actionError ? <p className="mt-3 text-[#8a2b1c]">{actionError}</p> : null}
        {errors.length === 0 ? (
          <p className={`${muted} mt-4`}>No saved stack traces.</p>
        ) : (
          <ul className="mt-4 m-0 grid list-none gap-4 p-0">
            {errors.map((error) => {
              const rowBusy = pendingDeleteId === error.id;
              return (
                <li
                  key={error.id}
                  className={`min-w-0 rounded-xl border border-line bg-white/40 p-5${
                    rowBusy ? " opacity-55" : ""
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-[0.9rem] font-semibold text-ink">
                        {new Date(error.createdAt).toLocaleString()}
                      </p>
                      <p className={`${muted} mt-1 break-all`}>
                        {error.requestMethod} {error.requestPath}
                      </p>
                      <p className="mt-2 m-0 text-ink">{error.message}</p>
                    </div>
                    <deleteFetcher.Form method="post" className="shrink-0 mr-3 mt-2">
                      <input type="hidden" name="intent" value="delete-error" />
                      <input type="hidden" name="errorId" value={error.id} />
                      <button
                        type="submit"
                        className={`${btnCompact} px-4 py-2`}
                        disabled={deleting}
                      >
                        {rowBusy ? "Deleting…" : "Delete"}
                      </button>
                    </deleteFetcher.Form>
                  </div>
                  <pre className="max-h-[28rem] max-w-full overflow-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-ink/5 p-3 text-[0.78rem] leading-[1.35] text-ink">
                    {error.stackTrace || ""}
                  </pre>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={`${panel} mt-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2>Allure test report</h2>
          <a
            className={btnSecondary}
            href="/admin/allure/index.html"
            target="_blank"
            rel="noreferrer"
          >
            Open report
          </a>
        </div>
        <p className={`${muted} my-3`}>
          Published after <code className={code}>mvn -pl api -am verify</code> in{" "}
          <code className={code}>highspring-rest</code> (restart the API afterward). Only ADMIN
          sessions can load it.
        </p>
        <iframe
          className="min-h-[70vh] w-full rounded-2xl border border-line bg-white"
          title="Allure report"
          src="/admin/allure/index.html"
        />
        <p className={`${muted} mt-3`}>
          Tip: open <Link to="/admin/allure/index.html">/admin/allure</Link> for a full-page view
          proxied with your admin session.
        </p>
      </section>

      <section className={`${panel} mt-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2>Playwright E2E report</h2>
          <a
            className={btnSecondary}
            href="/admin/playwright/index.html"
            target="_blank"
            rel="noreferrer"
          >
            Open report
          </a>
        </div>
        <p className={`${muted} my-3`}>
          Written to <code className={code}>playwright-report/</code> after{" "}
          <code className={code}>yarn playwright test</code>. ADMIN only — served from this app.
        </p>
        <iframe
          className="min-h-[70vh] w-full rounded-2xl border border-line bg-white"
          title="Playwright report"
          src="/admin/playwright/index.html"
        />
      </section>

      <section className={`${panel} mt-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2>API docs (Javadoc)</h2>
            <p className={`${muted} mt-[0.35rem]`}>
              HTTP status / error codes and resource tree. Publish with{" "}
              <code className={code}>mvn javadoc:aggregate</code>.
            </p>
          </div>
          <a
            className={btnCompact}
            href="/admin/javadoc/index.html"
            target="_blank"
            rel="noreferrer"
          >
            Open
          </a>
        </div>
      </section>

      <section className={`${panel} mt-6`}>
        <h2>Client storage</h2>
        <p className={`${muted} mb-[0.85rem]`}>
          Highspring does not use <code className={code}>window.localStorage</code> (the cart lives
          in Postgres). The only browser-held auth data is the httpOnly Remix session cookie below.
        </p>
        <table className={table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Example value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="w-36 whitespace-nowrap">
                <code className={code}>__highspring</code>
              </td>
              <td>
                Cookie name for Remix <code className={code}>createCookieSessionStorage</code>.
                HttpOnly, path <code className={code}>/</code>, SameSite=Lax. Holds signed session
                payload (not readable from JS).
              </td>
              <td className="max-w-xs">
                <code className={code}>eyJhbGciOiJIUzI1NiJ9.…</code> (opaque signed cookie)
              </td>
            </tr>
            <tr>
              <td className="w-36 whitespace-nowrap">
                <code className={code}>user</code>
              </td>
              <td>
                Key inside the cookie session. JSON string of the signed-in API session returned
                after Google OAuth.
              </td>
              <td className="max-w-xs">
                <code
                  className={`${code} inline-block max-w-full whitespace-pre-wrap break-words leading-[1.35]`}
                >
                  {`{"sessionId":"a1b2c3d4-…","userId":"e5f6…","email":"you@example.com","displayName":"Alex Shopper","role":"ADMIN"}`}
                </code>
              </td>
            </tr>
            <tr>
              <td className="w-36 whitespace-nowrap">
                <code className={code}>user.sessionId</code>
              </td>
              <td>
                API session UUID. Sent as <code className={code}>Authorization: session:{"{uuid}"}</code>{" "}
                on Remix server → API calls.
              </td>
              <td className="max-w-xs">
                <code className={code}>a1b2c3d4-e5f6-7890-abcd-ef1234567890</code>
              </td>
            </tr>
            <tr>
              <td className="w-36 whitespace-nowrap">
                <code className={code}>user.userId</code>
              </td>
              <td>Stable Highspring user id (DB primary key) for the signed-in account.</td>
              <td className="max-w-xs">
                <code className={code}>8f3c2a1b-4d5e-6f70-8192-a3b4c5d6e7f8</code>
              </td>
            </tr>
            <tr>
              <td className="w-36 whitespace-nowrap">
                <code className={code}>user.email</code>
              </td>
              <td>
                Google account email. Compared to <code className={code}>ADMIN_EMAILS</code> for the
                ADMIN role.
              </td>
              <td className="max-w-xs">
                <code className={code}>michaelpaquette@gmail.com</code>
              </td>
            </tr>
            <tr>
              <td className="w-36 whitespace-nowrap">
                <code className={code}>user.displayName</code>
              </td>
              <td>Optional display name from Google profile; may be null.</td>
              <td className="max-w-xs">
                <code className={code}>Alex Shopper</code> or <code className={code}>null</code>
              </td>
            </tr>
            <tr>
              <td className="w-36 whitespace-nowrap">
                <code className={code}>user.role</code>
              </td>
              <td>
                Authorization role from the API: <code className={code}>CUSTOMER</code> or{" "}
                <code className={code}>ADMIN</code>.
              </td>
              <td className="max-w-xs">
                <code className={code}>ADMIN</code>
              </td>
            </tr>
            <tr>
              <td className="w-36 whitespace-nowrap">
                <code className={code}>localStorage.*</code>
              </td>
              <td>
                Not used. Anonymous-cart apps often store a cart JSON here until login; Highspring
                requires Google sign-in first, so the server cart is enough.
              </td>
              <td className="max-w-xs">
                <code className={code}>—</code> (empty)
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}
