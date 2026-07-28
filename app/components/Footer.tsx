import { Link } from "@remix-run/react";

/**
 * Site-wide footer — quiet branding and year.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <Link className="site-footer-brand" to="/">
          Highspring
        </Link>
        <p>Thoughtful pricing for a simple cart.</p>
        <p className="site-footer-meta">© {year} Highspring</p>
      </div>
    </footer>
  );
}
