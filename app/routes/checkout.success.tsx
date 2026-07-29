/**
 * Old success URL kept for bookmarks: /checkout/success?id=…
 * Forwards to the home thank-you view.
 */
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const id = new URL(request.url).searchParams.get("id");
  const target = id ? `/?thanks=1&id=${encodeURIComponent(id)}` : "/?thanks=1";
  return redirect(target);
}
