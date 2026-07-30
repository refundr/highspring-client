/**
 * Public browser origin for OAuth redirect URIs.
 *
 * Behind Render (and similar proxies), `new URL(request.url).origin` is often
 * `http://…` even though users hit `https://…`. Google requires an exact match
 * to the registered redirect URI, so we honor forwarded headers / PUBLIC_APP_URL.
 */
export function publicOrigin(request: Request): string {
  const configured = process.env.PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host") || url.host;
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  // Render terminates TLS at the edge; request.url / forwarded proto can be http.
  const onRender = host.endsWith(".onrender.com");
  const proto = onRender
    ? "https"
    : forwardedProto || (url.protocol === "https:" ? "https" : "http");
  return `${proto}://${host}`;
}
