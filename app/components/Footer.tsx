/**
 * Site-wide footer — quiet branding, year, and git commit version.
 * Rendered from root.tsx so every page gets it automatically.
 */
import { Link } from "@remix-run/react";

const COMMIT_SHA = typeof __COMMIT_SHA__ === "string" ? __COMMIT_SHA__ : "unknown";
const SHORT_SHA = COMMIT_SHA === "unknown" ? "unknown" : COMMIT_SHA.slice(0, 7);
const COMMIT_URL =
  COMMIT_SHA !== "unknown"
    ? `https://github.com/refundr/highspring-client/commit/${COMMIT_SHA}`
    : null;

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
        <p className="mt-[0.35rem] text-[0.85rem] text-ink/50">
          © {year} Highspring
          {" · "}
          {COMMIT_URL ? (
            <a
              className="font-mono text-ink/50 underline-offset-2 hover:text-ink hover:underline"
              href={COMMIT_URL}
              title={COMMIT_SHA}
              target="_blank"
              rel="noreferrer"
            >
              {SHORT_SHA}
            </a>
          ) : (
            <span className="font-mono">{SHORT_SHA}</span>
          )}
        </p>
      </div>
    </footer>
  );
}
