import { expect, test } from "@playwright/test";

import { agentState, column, dragTo, loadSample, noteByText, openFreshBoard } from "./helpers/board";

export const TURN_BUDGET_MS = 35_000;

test.describe.configure({ retries: 1 });

test("two drags teach the agent a theme and matching notes glide in with reasons", async ({ page, baseURL }) => {
  test.setTimeout(240_000);
  await openFreshBoard(page, baseURL ?? "", { autoTeach: true });
  await loadSample(page);
  await page.evaluate(() => {
    (window as unknown as { __stigiLoadMarker: string }).__stigiLoadMarker = "money-shot";
  });

  await dragTo(page, noteByText(page, "which plan am I even on?"), page.getByTestId("new-cluster-zone"));
  const untitled = column(page, "Untitled");
  await expect(untitled.locator("[data-note-id]")).toHaveCount(1);
  await dragTo(page, noteByText(page, "the billing page makes no sense"), untitled);
  const startedAt = Date.now();

  // The second seed makes the UI hand off to the agent automatically (no prompt typed).
  await expect(agentState(page)).toHaveAttribute("data-agent-state", "running", { timeout: 15_000 });

  const seed = page.locator("[data-note-id]", { hasText: "which plan am I even on?" }).first();
  const states: string[] = [];
  while (Date.now() - startedAt < TURN_BUDGET_MS + 20_000) {
    const clusterId = await seed.getAttribute("data-cluster-id");
    const taughtColumn = page.locator(`section[data-cluster-id="${clusterId}"]`);
    const signature = `${await taughtColumn.getAttribute("data-cluster-name")}|${await taughtColumn.locator("[data-note-id]").count()}`;
    if (states[states.length - 1] !== signature) states.push(signature);
    if ((await agentState(page).getAttribute("data-agent-state")) === "idle") break;
    await page.waitForTimeout(500);
  }
  const elapsed = Date.now() - startedAt;
  expect(elapsed, `teach turn took ${elapsed} ms`).toBeLessThan(TURN_BUDGET_MS);

  const clusterId = await seed.getAttribute("data-cluster-id");
  const taught = page.locator(`section[data-cluster-id="${clusterId}"]`);
  await expect(taught).not.toHaveAttribute("data-cluster-name", "Untitled");
  // The run-end refetch may land just after the idle flip: poll instead of a one-shot count.
  await expect.poll(() => taught.locator('[data-moved-by="agent"]').count(), { timeout: 10_000 }).toBeGreaterThanOrEqual(6);
  for (const reason of await taught.locator(".stigi-note__reason").allInnerTexts()) {
    expect(reason.replace(/^Agent:\s*/, "").trim().length).toBeGreaterThan(3);
  }
  expect(states.length, `board states seen during the turn: ${states.join(" -> ")}`).toBeGreaterThanOrEqual(3);
  expect(await page.evaluate(() => (window as unknown as { __stigiLoadMarker?: string }).__stigiLoadMarker)).toBe("money-shot");
});
