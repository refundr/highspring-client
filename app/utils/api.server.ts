const API_URL = process.env.API_URL || "http://127.0.0.1:8080";

export type Session = {
  sessionId: string;
  userId: string;
  email: string;
  displayName: string | null;
  role: "CUSTOMER" | "ADMIN";
};

export type Product = {
  id: string;
  name: string;
  unitPrice: number;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  discountPercent: number;
};

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

export type AdminTotals = {
  purchaseCount: number;
  totalRevenue: number;
  totalTaxCollected: number;
  totalSubtotal: number;
};

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
    headers.set("Authorization", `session:${init.sessionId}`);
  }
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed (${response.status})`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function getAuthUrl(redirectUri: string, state: string) {
  return api<{ uri: string }>("/v1/auth/google/url/", {
    method: "POST",
    body: JSON.stringify({ redirectUri, state }),
  });
}

export function exchangeCode(code: string, redirectUri: string) {
  return api<Session>("/v1/auth/google/callback/", {
    method: "POST",
    body: JSON.stringify({ code, redirectUri }),
  });
}

export function fetchMe(sessionId: string) {
  return api<Session>("/v1/me/", { sessionId });
}

export function fetchProducts(sessionId: string) {
  return api<Product[]>("/v1/products/", { sessionId });
}

export function createPurchase(
  sessionId: string,
  items: Array<{ productId: string; quantity: number }>
) {
  return api<Purchase>("/v1/purchases/", {
    method: "POST",
    sessionId,
    body: JSON.stringify({ items }),
  });
}

export function fetchAdminTotals(sessionId: string) {
  return api<AdminTotals>("/v1/admin/totals/", { sessionId });
}

export function fetchAdminPurchases(sessionId: string) {
  return api<Purchase[]>("/v1/admin/purchases/", { sessionId });
}

export function fetchAdminErrors(sessionId: string) {
  return api<ErrorLog[]>("/v1/admin/errors/", { sessionId });
}

export function allureReportUrl() {
  return `${API_URL}/v1/admin/allure/`;
}

export { API_URL };
