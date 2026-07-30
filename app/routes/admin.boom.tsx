/**
 * Demo helper: GET /admin/boom → calls API boom endpoint → back to /admin?boom=1.
 * The API is expected to return 500; we catch that and still redirect so the new
 * error row (and optional alert email) can show on the dashboard.
 */
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { triggerDemoBoom } from "~/utils/api.server";
import { readSessionUser } from "~/utils/session.server";

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
