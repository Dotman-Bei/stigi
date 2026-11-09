import { beforeEach, describe, expect, it } from "vitest";

import { resetTestDb } from "../server/db/test-db.js";
import getBoardDigest from "./get-board-digest.js";
import getReport from "./get-report.js";
import importNotes from "./import-notes.js";
import saveReport from "./save-report.js";

const user = { userEmail: "ada@stigi.test", caller: "frontend" as const };
const agent = { userEmail: "ada@stigi.test", caller: "tool" as const };

describe("report actions", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("digests the board into themes by size with verbatim quotes", async () => {
    await importNotes.run({ sample: true }, user);
    const digest = await getBoardDigest.run({}, agent);
    expect(digest.totalNotes).toBe(200);
    expect(digest.unsortedCount).toBe(50);
    expect(digest.sampleNotes).toBe(200);
    expect(digest.themes).toHaveLength(6);
    expect(digest.themes.every((t) => t.noteCount === 25 && t.share === 13)).toBe(true);
    expect(digest.themes[0]?.quotes).toHaveLength(3);
    expect(digest.themes.map((t) => t.name)).toEqual([...digest.themes.map((t) => t.name)].sort((a, b) => a.localeCompare(b)));
  });

  it("starts empty, then saves and reads the report with who wrote it", async () => {
    expect(await getReport.run({}, user)).toMatchObject({ markdown: "", updatedBy: null, updatedAt: null });
    await saveReport.run({ markdown: "# Insights\n_200 comments; sample data_" }, agent);
    expect(await getReport.run({}, user)).toMatchObject({ markdown: "# Insights\n_200 comments; sample data_", updatedBy: "agent" });
    await saveReport.run({ markdown: "# Edited" }, user);
    expect(await getReport.run({}, user)).toMatchObject({ markdown: "# Edited", updatedBy: "user" });
  });

  it("keeps reports per user", async () => {
    await saveReport.run({ markdown: "# Ada" }, user);
    expect((await getReport.run({}, { userEmail: "bob@stigi.test", caller: "frontend" as const })).markdown).toBe("");
  });
});
