import { beforeEach, describe, expect, it } from "vitest";

import { resetTestDb } from "../server/db/test-db.js";
import { loadBoard } from "../server/lib/board-store.js";
import createCluster from "./create-cluster.js";
import importNotes from "./import-notes.js";
import moveNotes from "./move-notes.js";

const OWNER = "ada@stigi.test";
const user = { userEmail: OWNER, caller: "frontend" as const };
const agent = { userEmail: OWNER, caller: "tool" as const };

async function setup() {
  await importNotes.run({ csv: "comment\nA\nB\nC\nD\n" }, user);
  const target = await createCluster.run({ name: "Theme" }, user);
  const board = await loadBoard(OWNER);
  return { target: target.id, ids: board.unsorted.map((n) => n.id) };
}

describe("move-notes", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("records agent moves with their one-line reasons, appended to the target", async () => {
    const { target, ids } = await setup();
    const result = await moveNotes.run({
      moves: [
        { noteId: ids[0] ?? "", clusterId: target, reason: "Unsure which plan they are on" },
        { noteId: ids[1] ?? "", clusterId: target, reason: "  Confused by the billing page  " },
      ],
    }, agent);
    expect(result.moved).toBe(2);
    const notes = (await loadBoard(OWNER)).clusters[0]?.notes ?? [];
    expect(notes.map((n) => n.reason)).toEqual(["Unsure which plan they are on", "Confused by the billing page"]);
    expect(notes.every((n) => n.movedBy === "agent" && n.movedAt !== null)).toBe(true);
    expect(notes.map((n) => n.position)).toEqual([0, 1]);
  });

  it("rejects agent moves into a cluster without a reason", async () => {
    const { target, ids } = await setup();
    await expect(moveNotes.run({ moves: [{ noteId: ids[0] ?? "", clusterId: target }] }, agent)).rejects.toThrow(/one-line reason/);
    await expect(moveNotes.run({ moves: [{ noteId: ids[0] ?? "", clusterId: target, reason: "   " }] }, agent)).rejects.toThrow(/one-line reason/);
  });

  it("records user moves without reasons and clears an earlier agent reason", async () => {
    const { target, ids } = await setup();
    const noteId = ids[0] ?? "";
    await moveNotes.run({ moves: [{ noteId, clusterId: target, reason: "Agent thought so" }] }, agent);
    await moveNotes.run({ moves: [{ noteId, clusterId: null, reason: "ignored for users" }] }, user);
    const back = (await loadBoard(OWNER)).unsorted.find((n) => n.id === noteId);
    expect(back).toMatchObject({ clusterId: null, reason: null, movedBy: "user" });
  });

  it("rejects duplicates and unknown notes or clusters", async () => {
    const { target, ids } = await setup();
    const noteId = ids[0] ?? "";
    await expect(moveNotes.run({ moves: [{ noteId, clusterId: target }, { noteId, clusterId: null }] }, user)).rejects.toThrow(/only once/);
    await expect(moveNotes.run({ moves: [{ noteId: "nope", clusterId: target }] }, user)).rejects.toThrow(/Note not found/);
    await expect(moveNotes.run({ moves: [{ noteId, clusterId: "nope" }] }, user)).rejects.toThrow(/Cluster not found/);
  });
});
