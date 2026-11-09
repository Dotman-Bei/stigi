import { beforeEach, describe, expect, it } from "vitest";

import { resetTestDb } from "../server/db/test-db.js";
import { loadBoard } from "../server/lib/board-store.js";
import createCluster from "./create-cluster.js";
import importNotes from "./import-notes.js";
import listNotes from "./list-notes.js";

const OWNER = "ada@stigi.test";
const user = { userEmail: OWNER, caller: "frontend" as const };
const agent = { userEmail: OWNER, caller: "tool" as const };

describe("list-notes", () => {
  beforeEach(async () => {
    await resetTestDb();
    await importNotes.run({ sample: true }, user);
  });

  it("pages through unsorted notes compactly", async () => {
    const first = await listNotes.run({ scope: "unsorted", limit: 25, offset: 0 }, agent);
    expect(first.total).toBe(50);
    expect(first.notes).toHaveLength(25);
    expect(first.nextOffset).toBe(25);
    expect(first.notes[0]).toEqual({ id: expect.any(String), text: expect.any(String), cluster: null });
    const second = await listNotes.run({ scope: "unsorted", limit: 25, offset: 25 }, agent);
    expect(second.nextOffset).toBeNull();
  });

  it("lists every note outside one cluster with cluster names, including Unsorted", async () => {
    const board = await loadBoard(OWNER);
    const seeds = board.unsorted.slice(0, 2).map((n) => n.id);
    const taught = await createCluster.run({ noteIds: seeds }, user);
    const outside = await listNotes.run({ scope: "outside-cluster", clusterId: taught.id, limit: 250, offset: 0 }, agent);
    expect(outside.total).toBe(198);
    expect(outside.notes.some((n) => seeds.includes(n.id))).toBe(false);
    expect(outside.notes.some((n) => n.cluster === "Mobile app")).toBe(true);
    expect(outside.notes.some((n) => n.cluster === null)).toBe(true);
  });

  it("requires an owned clusterId for outside-cluster", async () => {
    await expect(listNotes.run({ scope: "outside-cluster", limit: 10, offset: 0 }, agent)).rejects.toThrow(/needs clusterId/);
    await expect(listNotes.run({ scope: "outside-cluster", clusterId: "nope", limit: 10, offset: 0 }, agent)).rejects.toThrow(/Cluster not found/);
  });

  it("lists all notes", async () => {
    expect((await listNotes.run({ scope: "all", limit: 5, offset: 0 }, agent)).total).toBe(200);
  });
});
