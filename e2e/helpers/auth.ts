import type { APIRequestContext, Page } from "@playwright/test";

const API_URL = process.env.API_URL || "http://127.0.0.1:8090";
const E2E_LOGIN_SECRET = process.env.E2E_LOGIN_SECRET || "highspring-e2e-secret";

type ApiSession = {
  sessionId: string;
  userId: string;
  email: string;
  displayName: string | null;
  role: "CUSTOMER" | "ADMIN";
};

/** Create an API session without Google (requires E2E_AUTH_ENABLED=true on the API). */
export async function createApiSession(request: APIRequestContext): Promise<ApiSession> {
  const response = await request.post(`${API_URL}/v1/auth/e2e/login/`, {
    data: {
      email: "e2e-shopper@example.com",
      displayName: "E2E Shopper",
    },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `E2E API login failed (${response.status()}). Is the API running with E2E_AUTH_ENABLED=true?\n${body}`
    );
  }
  return (await response.json()) as ApiSession;
}

/** Set the Remix signed-in cookie via the gated /e2e/session action. */
export async function signInThroughRemix(page: Page, session: ApiSession): Promise<void> {
  const response = await page.request.post("/e2e/session", {
    headers: {
      "x-e2e-secret": E2E_LOGIN_SECRET,
      "Content-Type": "application/json",
    },
    data: session,
    maxRedirects: 0,
  });
  // Remix redirects to /shop with Set-Cookie; Playwright request API follows or returns 302.
  if (response.status() !== 302 && response.status() !== 200) {
    throw new Error(`Remix e2e session failed (${response.status()}): ${await response.text()}`);
  }
}
