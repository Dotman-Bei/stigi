import { expect, type Page } from "@playwright/test";

export interface TestAccount {
  email: string;
  password: string;
}

export function newTestAccount(): TestAccount {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return { email: `stigi-e2e+${stamp}@example.com`, password: `Stigi-e2e-${stamp}-Pw1!` };
}

/** Registers and signs in through the page's request context so the browser shares the session cookie. */
export async function signUpAndSignIn(page: Page, baseURL: string): Promise<TestAccount> {
  const account = newTestAccount();
  const headers = { origin: baseURL, "content-type": "application/json" };
  const register = await page.request.post(`${baseURL}/_agent-native/auth/register`, { data: account, headers });
  expect(register.status(), `register: ${await register.text()}`).toBeLessThan(400);
  const login = await page.request.post(`${baseURL}/_agent-native/auth/login`, { data: account, headers });
  expect(login.status(), `login: ${await login.text()}`).toBeLessThan(400);
  return account;
}
