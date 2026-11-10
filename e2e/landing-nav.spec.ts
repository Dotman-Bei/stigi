import { expect, test, type Page } from "@playwright/test";

import { signUpAndSignIn } from "./helpers/auth";

const LANDING_H1 = "The feedback board for product teams";

async function expectLanding(page: Page): Promise<void> {
  await expect(page).toHaveURL((url) => url.pathname === "/", { timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1, name: LANDING_H1 })).toBeVisible();
}

async function openBoard(page: Page): Promise<void> {
  await page.goto("/board");
  await expect(page.getByRole("heading", { name: "Feedback board" })).toBeVisible();
}

// "/" is the public landing page, served outside React Router: signed-in users must reach it from the app.
test("signed in, the brand link and the Landing page item lead from the board to the landing and back @nav", async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  await signUpAndSignIn(page, baseURL ?? "");

  const direct = await page.request.get(`${baseURL}/`, { maxRedirects: 0 });
  expect(direct.status(), "signed-in GET / (no redirect)").toBe(200);
  expect(await direct.text()).toContain('data-page="stigi-landing"');

  await openBoard(page);
  await page.locator('a[href="/"]').filter({ has: page.locator('img[src="/stigi-mark-ink.svg"]') }).first().click();
  await expectLanding(page);

  await openBoard(page);
  await page.getByRole("link", { name: "Landing page", exact: true }).click();
  await expectLanding(page);

  await page.getByRole("link", { name: /Try Stigi/ }).first().click();
  await expect(page).toHaveURL((url) => url.pathname === "/board", { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Feedback board" })).toBeVisible();
});
