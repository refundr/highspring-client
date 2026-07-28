import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { triggerDemoBoom } from "~/utils/api.server";
import { readSessionUser } from "~/utils/session.server";

/**
 * Demo link: calls the API boom endpoint, then returns to the admin error list.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await readSessionUser(request);
  if (!user) return redirect("/");
  if (user.role !== "ADMIN") {
    throw new Response("Admins only", { status: 403 });
  }

  try {
    await triggerDemoBoom(user.sessionId);
  } catch {
    // Expected: API returns 500 and records/emails the error.
  }

  return redirect("/admin?boom=1");
}
