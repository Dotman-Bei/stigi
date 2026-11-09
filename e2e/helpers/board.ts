import { expect, type Locator, type Page } from "@playwright/test";

import { signUpAndSignIn } from "./auth";

export const AUTO_TEACH_STORAGE_KEY = "stigi.autoTeach";

export async function openFreshBoard(page: Page, baseURL: string, options: { autoTeach: boolean }): Promise<void> {
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [AUTO_TEACH_STORAGE_KEY, options.autoTeach ? "1" : "0"] as const,
  );
  await signUpAndSignIn(page, baseURL);
  await page.goto("/board");
  await expect(page.getByRole("heading", { name: "Feedback board" })).toBeVisible();
}

export async function loadSample(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Load sample data (200 notes)" }).click();
  await expect(page.locator("[data-note-id]")).toHaveCount(200, { timeout: 60_000 });
  await expect(page.getByText("Sample data · pre-sorted starting layout")).toBeVisible();
}

export function agentState(page: Page): Locator {
  return page.locator("[data-agent-state]");
}

export function noteByText(page: Page, text: string): Locator {
  return page.locator("[data-note-id]", { hasText: text }).first();
}

export function column(page: Page, name: string): Locator {
  return page.locator(`section[data-cluster-name="${name}"]`);
}

/** Pointer drag that dnd-kit's PointerSensor (6 px activation) recognises. */
export async function dragTo(page: Page, source: Locator, target: Locator): Promise<void> {
  await source.scrollIntoViewIfNeeded();
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error("dragTo: source or target is not visible");
  const startX = from.x + from.width / 2;
  const startY = from.y + from.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 12, startY + 12, { steps: 4 });
  await page.mouse.move(to.x + to.width / 2, to.y + Math.min(to.height / 2, 60), { steps: 20 });
  await page.mouse.up();
}
