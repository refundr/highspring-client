/**
 * Shared top navigation for signed-in pages.
 *
 * Shows Admin only when `user.role === "ADMIN"` (from the cookie / last /v1/me/).
 * The API still re-checks admin on every /v1/admin/* call — this is UX, not the real lock.
 *
 * Sign out is a POST form (not a GET link) so other sites cannot log you out with <img src=…>.
 */
import { Form, Link } from "@remix-run/react";
import type { Session } from "~/utils/api.server";
import { brand, btn, btnSecondary } from "~/utils/ui";

type AppNavProps = {
  user: Session;
  /** Highlight the current area in the nav */
  current?: "shop" | "admin" | "home";
  /** Total quantity of items in the persisted cart */
  cartCount?: number;
};

export function AppNav({ user, current = "shop", cartCount = 0 }: AppNavProps) {
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="mb-8 flex items-center justify-between gap-4">
      <Link className={brand} to="/" aria-label="Highspring home">
        Highspring
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <span>
          {user.email}
          {isAdmin ? " · ADMIN" : ""}
        </span>
        {current === "shop" ? (
          // On the shop page, jump to the sticky cart panel (#cart).
          <a className={btnSecondary} href="#cart">
            Cart{cartCount > 0 ? ` (${cartCount})` : ""}
          </a>
        ) : (
          <Link className={btnSecondary} to="/shop">
            Shop
          </Link>
        )}
        {isAdmin ? (
          <Link
            className={btn}
            to="/admin"
            aria-current={current === "admin" ? "page" : undefined}
          >
            Admin
          </Link>
        ) : null}
        <Form method="post" action="/logout">
          <button type="submit" className={btnSecondary}>
            Sign out
          </button>
        </Form>
      </div>
    </div>
  );
}
