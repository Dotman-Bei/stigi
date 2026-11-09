import { expect, test } from "@playwright/test";

import { signUpAndSignIn } from "./helpers/auth";

test("the duration probe answers 404 on the deployed app once the flag is removed", async ({ page, baseURL }) => {
  test.skip(process.env.STIGI_E2E_TARGET !== "deployed", "Only meaningful against the deployed app");
  await signUpAndSignIn(page, baseURL ?? "");
  const response = await page.request.get(`${baseURL}/api/duration-probe?ms=1000`);
  expect(response.status()).toBe(404);
});
