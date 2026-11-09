import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { loadSample, openFreshBoard } from "./helpers/board";

test("the report pane edits, saves, survives a reload and exports Markdown", async ({ page, baseURL }) => {
  await openFreshBoard(page, baseURL ?? "", { autoTeach: false });
  await loadSample(page);
  await page.getByRole("button", { name: "Report", exact: true }).click();
  const pane = page.getByTestId("report-pane");
  await expect(pane).toBeVisible();

  await pane.getByLabel("Report markdown").fill(
    "# Customer feedback insights\n_200 comments; sample data_\n\n## Top themes\n1. **Plan & billing confusion** — 16 comments",
  );
  await pane.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Report saved.")).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("report-pane").getByLabel("Report markdown")).toHaveValue(/Plan & billing confusion/);

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("report-pane").getByRole("button", { name: "Export .md" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^stigi-insight-report-\d{4}-\d{2}-\d{2}\.md$/);
  const filePath = await download.path();
  expect(readFileSync(filePath, "utf8")).toContain("sample data");
});
