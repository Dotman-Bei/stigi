import { expect, test } from "@playwright/test";

import { column, dragTo, loadSample, noteByText, openFreshBoard } from "./helpers/board";

// The app's agent panel uses storageKey "chat" (framework key: agent-native.<storageKey>.sidebar-open).
const SIDEBAR_OPEN_KEY = "agent-native.chat.sidebar-open";
const TEACH_MESSAGE = "Teach: name this new cluster and pull in every note that belongs with it.";
const HANDOFF_DELIVERED_MS = 10_000;

// Regression: with the agent sidebar CLOSED, the teach handoff opened the panel but the message never
// reached the chat, and the board stayed on "Agent working…". A judge's first visit hits this case.
test.describe.configure({ retries: 1 });

test("with the agent sidebar closed, two seed drags still deliver the teach turn to the chat", async ({ page, baseURL }) => {
  test.setTimeout(240_000);
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, "false");
    const w = window as unknown as { __stigiSidebarOpen?: boolean };
    window.addEventListener("agent-panel:state-change", (event) => {
      w.__stigiSidebarOpen = (event as CustomEvent<{ open: boolean }>).detail.open;
    });
  }, SIDEBAR_OPEN_KEY);
  await openFreshBoard(page, baseURL ?? "", { autoTeach: true });
  await loadSample(page);

  // The panel really is closed: it never announced itself open and the teach message is not on screen.
  expect(await page.evaluate(() => (window as unknown as { __stigiSidebarOpen?: boolean }).__stigiSidebarOpen === true)).toBe(false);
  await expect(page.getByText(TEACH_MESSAGE)).toHaveCount(0);

  await dragTo(page, noteByText(page, "which plan am I even on?"), page.getByTestId("new-cluster-zone"));
  const untitled = column(page, "Untitled");
  await expect(untitled.locator("[data-note-id]")).toHaveCount(1);
  await dragTo(page, noteByText(page, "the billing page makes no sense"), untitled);
  const handedOffAt = Date.now();

  // Delivery, not just the board's own "running" flag: the chat shows the teach request.
  await expect(page.getByText(TEACH_MESSAGE).first()).toBeVisible({ timeout: HANDOFF_DELIVERED_MS });
  expect(Date.now() - handedOffAt, "teach handoff reached the chat").toBeLessThan(HANDOFF_DELIVERED_MS + 1_000);

  // The turn really ran: the agent renamed the taught cluster.
  const seed = page.locator("[data-note-id]", { hasText: "which plan am I even on?" }).first();
  await expect.poll(async () => {
    const clusterId = await seed.getAttribute("data-cluster-id");
    return clusterId ? page.locator(`section[data-cluster-id="${clusterId}"]`).getAttribute("data-cluster-name") : null;
  }, { timeout: 60_000 }).not.toBe("Untitled");
});
