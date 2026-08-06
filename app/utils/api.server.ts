/**
 * API client for the Highspring Jetty backend.
 *
 * Server-only module (`*.server.ts`): Remix never ships this to the browser.
 * Routes' loaders/actions call these helpers so the API session UUID stays in the
 * httpOnly cookie instead of page JavaScript.
 *
 * Base URL defaults to local API (port 8090). Override with env `API_URL`.
 */
const API_URL = process.env.API_URL || "http://127.0.0.1:8090";

/**
 * Signed-in user as returned by the API (and stored in the Remix cookie).
 * `sessionId` is what we send as `Authorization: session:{uuid}`.
 */
export type Session = {
    sessionId: string;
    userId: string;
    email: string;
    displayName: string | null;
    role: "CUSTOMER" | "ADMIN";
};

/** Catalog product from GET /v1/products/ */
export type Product = {
    id: string;
    name: string;
    unitPrice: number;
    imageUrl: string;
    categoryId: string;
    categoryCode: string;
    categoryName: string;
    /** Category discount applied before tax (e.g. 10 means 10%). */
    discountPercent: number;
};

/** Server-persisted cart for the current user (not localStorage). */
export type Cart = {
    items: Array<{
        productId: string;
        productName: string;
        imageUrl: string;
        unitPrice: number;
        quantity: number;
        discountPercent: number;
        lineSubtotal: number;
    }>;
    subtotal: number;
    salesTax: number;
    total: number;
    taxRate: number;
    itemCount: number;
};

/** Completed order after checkout (or legacy POST /v1/purchases/). */
export type Purchase = {
    id: string;
    userId: string;
    subtotal: number;
    salesTax: number;
    total: number;
    taxRate: number;
    createdAt: string;
    items: Array<{
        productId: string;
        productName: string;
        unitPrice: number;
        quantity: number;
        discountPercent: number;
        lineSubtotal: number;
    }>;
};

/** Admin KPI strip on /admin */
export type AdminTotals = {
    purchaseCount: number;
    totalRevenue: number;
    totalTaxCollected: number;
    totalSubtotal: number;
};

/** One row from api_error_log (unexpected 500s only). */
export type ErrorLog = {
    id: number;
    level: string;
    loggerName: string;
    message: string;
    stackTrace: string;
    requestMethod: string;
    requestPath: string;
    userId: string | null;
    createdAt: string;
};

/**
 * Shared fetch wrapper.
 *
 * @param path - API path starting with `/v1/...`
 * @param init.sessionId - when set, adds `Authorization: session:{id}`
 * @throws Error with the response body text when status is not OK
 */
async function api<T>(
    path: string,
    init: RequestInit & { sessionId?: string } = {}
): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    if (init.sessionId) {
        // This header is the API's proof of login — never put it in a browser-visible cookie.
        headers.set("Authorization", `session:${init.sessionId}`);
    }
    const response = await fetch(`${API_URL}${path}`, {...init, headers});
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed (${response.status})`);
    }
    // 204 No Content has no JSON body (logout, some deletes).
    if (response.status === 204) {
        return undefined as T;
    }
    return (await response.json()) as T;
}

/** Ask the API to build the Google OAuth consent URL. */
export function getAuthUrl(redirectUri: string, state: string) {
    return api<{ uri: string }>("/v1/auth/google/url/", {
        method: "POST",
        body: JSON.stringify({redirectUri, state}),
    });
}

/** Exchange Google's `code` for a Highspring Session (creates api_session on the server). */
export function exchangeCode(code: string, redirectUri: string) {
    return api<Session>("/v1/auth/google/callback/", {
        method: "POST",
        body: JSON.stringify({code, redirectUri}),
    });
}

/**
 * Deletes the API session so the bearer token stops working.
 * Call this before clearing the Remix cookie on logout.
 */
export async function logoutSession(sessionId: string) {
    try {
        await api<void>("/v1/auth/logout/", {
            method: "DELETE",
            sessionId,
        });
    } catch {
        // Already expired/revoked — still clear the Remix cookie in the route action.
    }
}

/** Current user + role (useful after ADMIN_EMAILS config changes). */
export function fetchMe(sessionId: string) {
    return api<Session>("/v1/me/", {sessionId});
}

export function fetchProducts(sessionId: string) {
    return api<Product[]>("/v1/products/", {sessionId});
}

export function fetchCart(sessionId: string) {
    return api<Cart>("/v1/cart/", {sessionId});
}

/** Add quantity to a product line (or create the line). Returns the full cart. */
export function addCartItem(sessionId: string, productId: string, quantity: number) {
    return api<Cart>("/v1/cart/items/", {
        method: "POST",
        sessionId,
        body: JSON.stringify({productId, quantity}),
    });
}

/** Set absolute quantity; quantity 0 removes the line. */
export function setCartItemQuantity(sessionId: string, productId: string, quantity: number) {
    return api<Cart>("/v1/cart/items/", {
        method: "PUT",
        sessionId,
        body: JSON.stringify({productId, quantity}),
    });
}

/**
 * Turn the cart into a purchase and empty the cart (demo: no real payment provider).
 */
export function checkoutCart(sessionId: string) {
    return api<Purchase>("/v1/cart/checkout/", {
        method: "POST",
        sessionId,
        body: "{}",
    });
}

export function fetchPurchase(sessionId: string, purchaseId: string) {
    return api<Purchase>(`/v1/purchases/${purchaseId}/`, {sessionId});
}

/** Alternate purchase API that accepts an items array (used less than cart checkout). */
export function createPurchase(
    sessionId: string,
    items: Array<{ productId: string; quantity: number }>
) {
    return api<Purchase>("/v1/purchases/", {
        method: "POST",
        sessionId,
        body: JSON.stringify({items}),
    });
}

export function fetchAdminTotals(sessionId: string) {
    return api<AdminTotals>("/v1/admin/totals/", {sessionId});
}

export function fetchAdminPurchases(sessionId: string) {
    return api<Purchase[]>("/v1/admin/purchases/", {sessionId});
}

export function fetchAdminErrors(sessionId: string) {
    return api<ErrorLog[]>("/v1/admin/errors/", {sessionId});
}

export function deleteAdminError(sessionId: string, errorId: number) {
    return api<void>(`/v1/admin/errors/${errorId}/`, {
        method: "DELETE",
        sessionId,
    });
}

export function deleteAllAdminErrors(sessionId: string) {
    return api<{ deleted: number }>("/v1/admin/errors/", {
        method: "DELETE",
        sessionId,
    });
}

/** Demo-only: forces a 500 on the API when ENABLE_BOOM_ENDPOINT=true. */
export function triggerDemoBoom(sessionId: string) {
    return api<void>("/v1/admin/boom/", {sessionId});
}

export function allureReportUrl() {
    return `${API_URL}/v1/admin/allure/`;
}

export {API_URL};
