import { expect, test } from "@playwright/test";

import { agentState, column, loadSample, openFreshBoard } from "./helpers/board";

const TURN_BUDGET_MS = 35_000;

test.describe.configure({ retries: 1 });

test("one sort turn files one batch of up to 25 unsorted notes inside the turn budget", async ({ page, baseURL }) => {
  test.setTimeout(240_000);
  await openFreshBoard(page, baseURL ?? "", { autoTeach: false });
  await loadSample(page);
  const unsorted = column(page, "Unsorted").locator("[data-note-id]");
  await expect(unsorted).toHaveCount(50);

  await page.getByRole("button", { name: "Sort with agent" }).click();
  const startedAt = Date.now();
  await expect(agentState(page)).toHaveAttribute("data-agent-state", "running", { timeout: 15_000 });
  // Stop the loop now so it does not send a second batch when this turn ends.
  await page.getByRole("button", { name: "Stop sorting" }).click();
  await expect(agentState(page)).toHaveAttribute("data-agent-state", "idle", { timeout: TURN_BUDGET_MS + 20_000 });
  const elapsed = Date.now() - startedAt;
  expect(elapsed, `sort turn took ${elapsed} ms`).toBeLessThan(TURN_BUDGET_MS);

  // Count only a settled board: the rendered Unsorted column must match the top bar's "N unsorted"
  // (with 750 ms polling a refetch or glide can briefly render the column empty).
  const headerUnsorted = page.getByText(/\d+ notes · \d+ themes · \d+ unsorted/);
  await expect.poll(async () => {
    const match = /(\d+) unsorted/.exec(await headerUnsorted.innerText());
    return match !== null && Number(match[1]) === (await unsorted.count());
  }, { timeout: 15_000 }).toBe(true);
  await expect.poll(async () => 50 - (await unsorted.count()), { timeout: 10_000 }).toBeGreaterThanOrEqual(20);
  const sorted = 50 - (await unsorted.count());
  expect(sorted).toBeLessThanOrEqual(25);
  const agentMoved = page.locator('[data-moved-by="agent"]');
  expect(await agentMoved.count()).toBe(sorted);
  for (const reason of await page.locator(".stigi-note__reason").allInnerTexts()) {
    expect(reason.replace(/^Agent:\s*/, "").trim().length).toBeGreaterThan(3);
  }
});
