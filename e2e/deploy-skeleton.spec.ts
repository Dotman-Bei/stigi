import { expect, test } from "@playwright/test";

import { signUpAndSignIn } from "./helpers/auth";

test.describe("deploy skeleton", () => {
  test("signed-out visitors meet the sign-in wall, not the board @auth", async ({ page }) => {
    await page.goto("/board");
    await expect(page.locator('input[type="email"]:visible').first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Feedback board" })).toHaveCount(0);
  });

  test("a fresh account signs up, signs in and reaches the board @auth", async ({ page, baseURL }) => {
    await signUpAndSignIn(page, baseURL ?? "");
    await page.goto("/board");
    await expect(page.getByRole("heading", { name: "Feedback board" })).toBeVisible();
  });

  test("the platform lets a signed-in request run 45 s and 58 s @probe", async ({ page, baseURL }) => {
    test.setTimeout(240_000);
    await signUpAndSignIn(page, baseURL ?? "");
    for (const ms of [45_000, 58_000]) {
      const response = await page.request.get(`${baseURL}/api/duration-probe?ms=${ms}`, { timeout: ms + 30_000 });
      expect(response.status(), `duration probe ${ms} ms`).toBe(200);
      const body = (await response.json()) as { ok: boolean; waitedMs: number };
      expect(body.ok).toBe(true);
      expect(body.waitedMs).toBe(ms);
    }
  });
});
