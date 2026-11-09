import { beforeEach, describe, expect, it } from "vitest";

import { getDb, schema } from "../db/index.js";
import { resetTestDb } from "../db/test-db.js";
import {
  clipText, countNotes, frontClusterPosition, getOwnedCluster, getOwnedClusters, getOwnedNotes,
  loadBoard, nextClusterPosition, nextNotePosition,
} from "./board-store.js";

const ADA = "ada@stigi.test";
const BOB = "bob@stigi.test";
const now = "2026-11-09T10:00:00.000Z";

async function cluster(id: string, owner: string, name: string | null, position: number) {
  await getDb().insert(schema.stigiClusters).values({ id, ownerEmail: owner, name, createdBy: "sample", position, createdAt: now, updatedAt: now });
}
async function note(id: string, owner: string, clusterId: string | null, position: number, source: "sample" | "import" = "sample") {
  await getDb().insert(schema.stigiNotes).values({ id, ownerEmail: owner, body: `note ${id}`, source, clusterId, reason: null, movedBy: null, movedAt: null, position, createdAt: now });
}

describe("board store", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("builds an ordered snapshot of the owner's board only", async () => {
    await cluster("c2", ADA, "Second", 1);
    await cluster("c1", ADA, "First", 0);
    await cluster("cb", BOB, "Bob's", 0);
    await note("n2", ADA, "c1", 1);
    await note("n1", ADA, "c1", 0);
    await note("u1", ADA, null, 0, "import");
    await note("orphan", ADA, "deleted-cluster", 0);
    await note("nb", BOB, "cb", 0);
    const board = await loadBoard(ADA);
    expect(board.clusters.map((c) => c.id)).toEqual(["c1", "c2"]);
    expect(board.clusters[0]?.notes.map((n) => n.id)).toEqual(["n1", "n2"]);
    expect(board.unsorted.map((n) => n.id).sort()).toEqual(["orphan", "u1"]);
    expect(board.totalNotes).toBe(4);
    expect(board.sampleNotes).toBe(3);
  });

  it("computes next and front positions", async () => {
    expect(await nextClusterPosition(ADA)).toBe(0);
    expect(await frontClusterPosition(ADA)).toBe(-1);
    await cluster("c1", ADA, "A", 0);
    await cluster("c2", ADA, "B", 3);
    expect(await nextClusterPosition(ADA)).toBe(4);
    expect(await frontClusterPosition(ADA)).toBe(-1);
    await note("n1", ADA, "c1", 5);
    expect(await nextNotePosition(ADA, "c1")).toBe(6);
    expect(await nextNotePosition(ADA, null)).toBe(0);
  });

  it("enforces ownership on lookups", async () => {
    await cluster("cb", BOB, "Bob's", 0);
    await note("nb", BOB, "cb", 0);
    await expect(getOwnedCluster(ADA, "cb")).rejects.toThrow(/Cluster not found/);
    await expect(getOwnedClusters(ADA, ["cb"])).rejects.toThrow(/Cluster not found/);
    await expect(getOwnedNotes(ADA, ["nb"])).rejects.toThrow(/Note not found/);
    expect((await getOwnedCluster(BOB, "cb")).name).toBe("Bob's");
    expect(await getOwnedNotes(BOB, [])).toEqual([]);
  });

  it("counts notes and clips text", async () => {
    await note("n1", ADA, null, 0, "sample");
    await note("n2", ADA, null, 1, "import");
    expect(await countNotes(ADA)).toEqual({ total: 2, sample: 1 });
    expect(clipText("  hello   world  ", 50)).toBe("hello world");
    expect(clipText("abcdefghij", 5)).toBe("abcd…");
  });
});
