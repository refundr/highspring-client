/**
 * Proxies published Allure HTML at `/admin/allure/*`.
 *
 * Why a proxy? The Allure files on the API require `Authorization: session:…`.
 * An <iframe src="http://api:8090/..."> cannot send that header from the browser.
 * Remix loads the bytes server-side with the admin session, then returns them
 * same-origin to the browser (cookie already proves admin on this app).
 *
 * The `$.tsx` filename is Remix's "splat" route — `params["*"]` is the rest of the path
 * (e.g. `index.html`, `data/…`, CSS/JS assets the report links to).
 */
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { API_URL } from "~/utils/api.server";
import { readSessionUser } from "~/utils/session.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await readSessionUser(request);
  if (!user) return redirect("/");
  if (user.role !== "ADMIN") {
    throw new Response("Admins only", { status: 403 });
  }

  const splat = params["*"] || "index.html";
  const target = `${API_URL}/v1/admin/allure/${splat}`;
  const response = await fetch(target, {
    headers: {
      Authorization: `session:${user.sessionId}`,
      Accept: "*/*",
    },
  });

  const contentType = response.headers.get("Content-Type") || "text/html";
  const body = await response.arrayBuffer();
  return new Response(body, {
    status: response.status,
    headers: {
      "Content-Type": contentType,
    },
  });
}
