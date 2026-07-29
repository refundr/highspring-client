/**
 * Server HTML renderer for each request.
 * Remix calls this; it stringifies the React tree and returns an HTML Response.
 * You rarely edit this file unless adding custom response headers globally
 * (prefer `headers` exports on routes / root.tsx instead).
 */
import type { AppLoadContext, EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToString } from "react-dom/server";

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  _loadContext: AppLoadContext
) {
  const html = renderToString(
    <RemixServer context={remixContext} url={request.url} />
  );
  responseHeaders.set("Content-Type", "text/html");
  return new Response("<!DOCTYPE html>" + html, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
