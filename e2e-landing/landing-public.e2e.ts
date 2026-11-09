import { expect, test } from "@playwright/test";

test("a signed-out GET / is 200 and shows the public landing page", async ({ page, request, baseURL }) => {
  const response = await request.get(`${baseURL}/`, { headers: { accept: "text/html" }, maxRedirects: 0 });
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/html");
  expect(await response.text()).toContain('data-page="stigi-landing"');
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The feedback board for product teams");
  await expect(page.locator('a[href="/board"]', { hasText: "Try Stigi" }).first()).toBeVisible();
  await expect(page.locator('input[type="email"]')).toHaveCount(0);
});

test("a signed-out visit to /board still lands on the sign-in screen", async ({ page }) => {
  await page.goto("/board");
  await expect(page.locator('input[type="email"]:visible').first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Feedback board" })).toHaveCount(0);
});
