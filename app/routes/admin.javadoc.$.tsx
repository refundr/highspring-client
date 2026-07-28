import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { API_URL } from "~/utils/api.server";
import { readSessionUser } from "~/utils/session.server";

/**
 * Proxies published JavaDoc (incl. HTTP status guide) with the admin session header.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await readSessionUser(request);
  if (!user) return redirect("/");
  if (user.role !== "ADMIN") {
    throw new Response("Admins only", { status: 403 });
  }

  const splat = params["*"] || "index.html";
  const target = `${API_URL}/v1/admin/javadoc/${splat}`;
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
