import { Link } from "@remix-run/react";
import type { Session } from "~/utils/api.server";

type AppNavProps = {
  user: Session;
  /** Highlight the current area in the nav */
  current?: "shop" | "admin";
  /** Total quantity of items in the persisted cart */
  cartCount?: number;
};

/**
 * Top navigation. Shows an Admin button only when the signed-in user is an ADMIN.
 */
export function AppNav({ user, current = "shop", cartCount = 0 }: AppNavProps) {
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="topbar">
      <Link className="brand" to="/" aria-label="Highspring home">
        Highspring
      </Link>
      <div className="nav">
        <span>
          {user.email}
          {isAdmin ? " · ADMIN" : ""}
        </span>
        {current === "shop" ? (
          <a className="button secondary cart-link" href="#cart">
            Cart{cartCount > 0 ? ` (${cartCount})` : ""}
          </a>
        ) : (
          <Link className="button secondary" to="/shop">
            Shop
          </Link>
        )}
        {isAdmin ? (
          <Link
            className="button"
            to="/admin"
            aria-current={current === "admin" ? "page" : undefined}
          >
            Admin
          </Link>
        ) : null}
        <Link className="button secondary" to="/?logout=1">
          Sign out
        </Link>
      </div>
    </div>
  );
}
