import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

/** Old success URL — send people to the home thank-you view. */
export async function loader({ request }: LoaderFunctionArgs) {
  const id = new URL(request.url).searchParams.get("id");
  const target = id ? `/?thanks=1&id=${encodeURIComponent(id)}` : "/?thanks=1";
  return redirect(target);
}
