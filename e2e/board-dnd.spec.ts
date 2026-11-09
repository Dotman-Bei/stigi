import { expect, test } from "@playwright/test";

import { agentState, column, dragTo, loadSample, noteByText, openFreshBoard } from "./helpers/board";

test.describe("board drag-and-drop (no agent)", () => {
  test("a fresh sign-up loads the pre-sorted sample, starts a cluster by drag and moves notes", async ({ page, baseURL }) => {
    await openFreshBoard(page, baseURL ?? "", { autoTeach: false });
    await loadSample(page);
    await expect(column(page, "Onboarding & setup").locator("[data-note-id]")).toHaveCount(25);
    await expect(column(page, "Unsorted").locator("[data-note-id]")).toHaveCount(50);

    await dragTo(page, noteByText(page, "which plan am I even on?"), page.getByTestId("new-cluster-zone"));
    const untitled = column(page, "Untitled");
    await expect(untitled.locator("[data-note-id]")).toHaveCount(1);
    await expect(untitled.getByText("Untitled — drop one more note to teach the agent")).toBeVisible();

    await dragTo(page, noteByText(page, "the billing page makes no sense"), untitled);
    await expect(untitled.locator("[data-note-id]")).toHaveCount(2);
    await expect(untitled.locator('[data-moved-by="user"]')).toHaveCount(2);

    await dragTo(page, noteByText(page, "the billing page makes no sense"), column(page, "Unsorted"));
    await expect(column(page, "Unsorted").locator("[data-note-id]")).toHaveCount(51);
    await expect(agentState(page)).toHaveAttribute("data-agent-state", "idle");
  });

  test("clicking notes selects them and shows the selection bar", async ({ page, baseURL }) => {
    await openFreshBoard(page, baseURL ?? "", { autoTeach: false });
    await loadSample(page);
    await noteByText(page, "which plan am I even on?").click();
    await noteByText(page, "the billing page makes no sense").click();
    await expect(page.getByText("2 selected")).toBeVisible();
    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await expect(page.getByText("2 selected")).toHaveCount(0);
  });
});
