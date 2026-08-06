/**
 * Root layout — wraps every page.
 *
 * Remix always renders this file around the matched route's default export.
 * - `links` → extra <link> tags (Google Fonts here; Tailwind CSS is imported below)
 * - `headers` → security headers on HTML responses (CSP, etc.)
 * - <Outlet /> → where the child route (shop, admin, …) is plugged in
 */
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { HeadersFunction, LinksFunction } from "@remix-run/node";
import { Footer } from "~/components/Footer";
import "./app.css";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Source+Sans+3:wght@400;600&display=swap",
  },
];

/**
 * Simple browser hardening.
 * CSRF for our forms is mostly SameSite=Lax on the session cookie (see session.server.ts).
 * CSP here limits where scripts/styles/images can load from.
 * A strict set of rules declaring which external assets the browser is allowed to fetch or execute.
 */
export const headers: HeadersFunction = () => ({
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "frame-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
});

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {/* Flex column so the footer can stick to the bottom on short pages */}
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          <Footer />
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
