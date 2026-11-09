import { expect, test } from "@playwright/test";

import { signUpAndSignIn } from "./helpers/auth";

// Permanent deploy smoke check: the agent's serverless functions must load. A Windows build once
// shipped agent-chat functions that crashed on import (ERR_MODULE_NOT_FOUND 'yjs'), so every
// /_agent-native/agent-chat* endpoint returned 500 while the board itself worked.
test("signed-in agent-chat endpoints answer 200 @smoke", async ({ page, baseURL }) => {
  await signUpAndSignIn(page, baseURL ?? "");
  const threads = await page.request.get(`${baseURL}/_agent-native/agent-chat/threads`);
  expect(threads.status(), "GET /_agent-native/agent-chat/threads").toBe(200);
});
