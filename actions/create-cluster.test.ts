import { beforeEach, describe, expect, it } from "vitest";

import { resetTestDb } from "../server/db/test-db.js";
import { loadBoard } from "../server/lib/board-store.js";
import createCluster from "./create-cluster.js";
import importNotes from "./import-notes.js";

const user = { userEmail: "ada@stigi.test", caller: "frontend" as const };
const agent = { userEmail: "ada@stigi.test", caller: "tool" as const };

describe("create-cluster", () => {
  beforeEach(async () => {
    await resetTestDb();
    await importNotes.run({ csv: "comment\nA\nB\nC\n" }, user);
  });

  it("creates an untitled user cluster in front and moves the dragged notes into it", async () => {
    const before = await loadBoard("ada@stigi.test");
    const ids = before.unsorted.slice(0, 2).map((n) => n.id);
    const result = await createCluster.run({ noteIds: ids }, user);
    expect(result.name).toBeNull();
    expect(result.message).toContain("untitled");
    const board = await loadBoard("ada@stigi.test");
    const created = board.clusters[0];
    expect(created?.id).toBe(result.id);
    expect(created?.createdBy).toBe("user");
    expect(created?.notes.map((n) => n.id)).toEqual(ids);
    expect(created?.notes.every((n) => n.movedBy === "user" && n.reason === null)).toBe(true);
    expect(board.unsorted).toHaveLength(1);
  });

  it("lets the agent create an empty named cluster but not move notes without reasons", async () => {
    const named = await createCluster.run({ name: "Performance" }, agent);
    expect(named.name).toBe("Performance");
    const board = await loadBoard("ada@stigi.test");
    expect(board.clusters.find((c) => c.id === named.id)?.createdBy).toBe("agent");
    const noteId = board.unsorted[0]?.id ?? "";
    await expect(createCluster.run({ name: "X", noteIds: [noteId] }, agent)).rejects.toThrow(/move-notes/);
  });

  it("puts each new cluster in front of the previous ones", async () => {
    const first = await createCluster.run({ name: "First" }, user);
    const second = await createCluster.run({ name: "Second" }, user);
    const board = await loadBoard("ada@stigi.test");
    expect(board.clusters.map((c) => c.id)).toEqual([second.id, first.id]);
  });

  it("rejects notes the caller does not own", async () => {
    await expect(createCluster.run({ noteIds: ["nope"] }, user)).rejects.toThrow(/Note not found/);
  });
});
