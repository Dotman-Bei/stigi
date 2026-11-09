import { mkdirSync } from "node:fs";

import { expect, test, type Locator, type Page } from "@playwright/test";

const OUT = "public/landing/assets/shots";
const CHIP = "Sample data · pre-sorted starting layout";

async function signUp(page: Page, baseURL: string): Promise<void> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const account = { email: `stigi-shots+${stamp}@example.com`, password: `Stigi-shots-${stamp}-Pw1!` };
  const headers = { origin: baseURL, "content-type": "application/json" };
  const register = await page.request.post(`${baseURL}/_agent-native/auth/register`, { data: account, headers });
  expect(register.status(), await register.text()).toBeLessThan(400);
  const login = await page.request.post(`${baseURL}/_agent-native/auth/login`, { data: account, headers });
  expect(login.status(), await login.text()).toBeLessThan(400);
}

/** Pointer drag that dnd-kit's PointerSensor (6 px activation) recognises. */
async function drag(page: Page, source: Locator, target: Locator): Promise<void> {
  await source.scrollIntoViewIfNeeded();
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error("drag: source or target is not visible");
  const x = from.x + from.width / 2;
  const y = from.y + from.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 12, y + 12, { steps: 4 });
  await page.mouse.move(to.x + to.width / 2, to.y + Math.min(to.height / 2, 60), { steps: 20 });
  await page.mouse.up();
}

async function shoot(page: Page, name: string): Promise<void> {
  await expect(page.getByText(CHIP)).toBeVisible();
  await expect(page.getByText("Loaded 200 sample notes")).toHaveCount(0, { timeout: 15_000 }); // the toast fades out first
  await page.getByRole("heading", { name: "Feedback board" }).scrollIntoViewIfNeeded();
  await page.mouse.move(1, 1);
  await page.waitForTimeout(600); // let the layout animation and hover states settle
  await page.screenshot({ path: `${OUT}/${name}`, type: "jpeg", quality: 82 });
}

test("capture real screenshots of the board with the labelled sample data", async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  mkdirSync(OUT, { recursive: true });
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.addInitScript(() => {
    window.localStorage.setItem("stigi.autoTeach", "0");
  });
  await signUp(page, baseURL ?? "");
  await page.goto("/board");
  await page.getByRole("button", { name: "Load sample data (200 notes)" }).click();
  await expect(page.locator("[data-note-id]")).toHaveCount(200, { timeout: 60_000 });
  await shoot(page, "board-overview.jpg");

  await page.setViewportSize({ width: 1180, height: 1340 });
  await shoot(page, "board-hero.jpg");

  // a tall window keeps the New-cluster zone and the dragged notes on screen together while dragging
  await page.setViewportSize({ width: 1600, height: 2400 });
  const note = (text: string) => page.locator("[data-note-id]", { hasText: text }).first();
  await drag(page, note("which plan am I even on?"), page.getByTestId("new-cluster-zone"));
  const untitled = page.locator('section[data-cluster-name="Untitled"]');
  await expect(untitled.locator("[data-note-id]")).toHaveCount(1);
  await drag(page, note("the billing page makes no sense"), untitled);
  await expect(untitled.locator("[data-note-id]")).toHaveCount(2);
  await page.setViewportSize({ width: 1600, height: 1000 });
  await shoot(page, "board-teach.jpg");

  await note("Android app logs me out every couple of days.").click();
  await note("Offline mode loses expenses I entered on the plane.").click();
  await expect(page.getByText("2 selected")).toBeVisible();
  await shoot(page, "board-selection.jpg");
});
