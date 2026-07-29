/**
 * Site-wide footer — quiet branding and year.
 * Rendered from root.tsx so every page gets it automatically.
 */
import { Link } from "@remix-run/react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto shrink-0 border-t border-line bg-white/30">
      <div className="mx-auto grid w-[min(1100px,calc(100%-2rem))] gap-[0.35rem] py-7 pb-8">
        <Link
          className="font-display text-[1.15rem] font-bold tracking-tight text-ink hover:text-leaf-dark"
          to="/"
        >
          Highspring
        </Link>
        <p className="text-[0.95rem]">Thoughtful pricing for a simple cart.</p>
        <p className="mt-[0.35rem] text-[0.85rem] text-ink/50">© {year} Highspring</p>
      </div>
    </footer>
  );
}
