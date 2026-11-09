import { beforeEach, describe, expect, it } from "vitest";

import { resetTestDb } from "../server/db/test-db.js";
import { loadBoard } from "../server/lib/board-store.js";
import { SAMPLE_START_CLUSTERS } from "../shared/sample-feedback.js";
import importNotes from "./import-notes.js";

const user = { userEmail: "ada@stigi.test", caller: "frontend" as const };

describe("import-notes", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("loads the labeled sample as a pre-sorted starting layout", async () => {
    const result = await importNotes.run({ sample: true }, user);
    expect(result).toMatchObject({ imported: 200, clustersCreated: 6 });
    expect(result.message).toContain("sample");
    const board = await loadBoard("ada@stigi.test");
    expect(board.clusters.map((c) => c.name)).toEqual([...SAMPLE_START_CLUSTERS]);
    expect(board.clusters.every((c) => c.createdBy === "sample" && c.notes.length === 25)).toBe(true);
    expect(board.unsorted).toHaveLength(50);
    expect(board.sampleNotes).toBe(200);
    const every = [...board.unsorted, ...board.clusters.flatMap((c) => c.notes)];
    expect(every.every((n) => n.source === "sample" && n.movedBy === null && n.reason === null)).toBe(true);
    const billing = board.clusters.find((c) => c.name === "Feature requests")?.notes.map((n) => n.body) ?? [];
    expect(billing).toContain("which plan am I even on?");
  });

  it("refuses to load the sample twice", async () => {
    await importNotes.run({ sample: true }, user);
    await expect(importNotes.run({ sample: true }, user)).rejects.toThrow(/already on your board/);
  });

  it("imports CSV comments into Unsorted", async () => {
    const result = await importNotes.run({ csv: "comment\nFirst\nSecond\n" }, user);
    expect(result).toMatchObject({ imported: 2, clustersCreated: 0 });
    const board = await loadBoard("ada@stigi.test");
    expect(board.unsorted.map((n) => n.body)).toEqual(["First", "Second"]);
    expect(board.unsorted.every((n) => n.source === "import")).toBe(true);
  });

  it("rejects empty CSV, oversize boards, missing input and anonymous callers", async () => {
    await expect(importNotes.run({ csv: "comment\n\n" }, user)).rejects.toThrow(/No comments found/);
    const big = `comment\n${Array.from({ length: 501 }, (_, i) => `c${i}`).join("\n")}`;
    await expect(importNotes.run({ csv: big }, user)).rejects.toThrow(/at most 500 notes/);
    await expect(importNotes.run({}, user)).rejects.toThrow(/either csv or sample/);
    await expect(importNotes.run({ sample: true }, { caller: "frontend" as const })).rejects.toThrow(/Sign in/);
  });
});
