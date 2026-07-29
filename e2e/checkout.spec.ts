import { expect, test } from "@playwright/test";
import { createApiSession, signInThroughRemix } from "./helpers/auth";

/**
 * Smoke: signed-in shopper adds an item, checks out, submits demo payment, sees thank-you.
 * One journey only — intentionally thin.
 */
test.describe("checkout payment smoke", () => {
  test("pay demo card and land on thank-you", async ({ page, request }) => {
    const session = await createApiSession(request);
    await signInThroughRemix(page, session);

    await page.goto("/shop");
    await expect(page.getByRole("heading", { name: /shop the catalog/i })).toBeVisible();

    // Add the first catalog product (qty defaults to 1).
    await page.getByRole("button", { name: /add to cart/i }).first().click();
    await expect(page.getByRole("link", { name: /check out/i })).toBeVisible();

    await page.getByRole("link", { name: /check out/i }).click();
    await expect(page.getByRole("heading", { name: /^checkout$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /payment/i })).toBeVisible();

    // Demo card fields are prefilled; submitting triggers the 3s processing delay + API checkout.
    await page.getByRole("button", { name: /^pay \$/i }).click();
    await expect(page.getByText(/contacting the payment provider/i)).toBeVisible();

    await expect(page.getByRole("heading", { name: /your payment went through/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/check your email for shipping details/i)).toBeVisible();
  });
});
