/**
 * Demo helper: GET /admin/boom → calls API boom endpoint → back to /admin.
 * Expects HTTP 500 when ENABLE_BOOM_ENDPOINT=true (error is logged + emailed).
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
    const result = await triggerDemoBoom(user.sessionId);
    if (result.status === 500) {
      return redirect("/admin?boom=1");
    }
    // e.g. 404 when ENABLE_BOOM_ENDPOINT is false in prod
    return redirect(`/admin?boom=0&boomStatus=${result.status}`);
  } catch {
    return redirect("/admin?boom=0&boomStatus=error");
  }
}
