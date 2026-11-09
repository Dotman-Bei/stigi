import { beforeEach, describe, expect, it } from "vitest";

import { getDb, schema } from "../server/db/index.js";
import { resetTestDb } from "../server/db/test-db.js";
import { loadBoard } from "../server/lib/board-store.js";
import createCluster from "./create-cluster.js";
import deleteCluster from "./delete-cluster.js";
import importNotes from "./import-notes.js";
import mergeClusters from "./merge-clusters.js";
import moveNotes from "./move-notes.js";
import resetBoard from "./reset-board.js";

const OWNER = "ada@stigi.test";
const user = { userEmail: OWNER, caller: "frontend" as const };
const agent = { userEmail: OWNER, caller: "tool" as const };
const bob = { userEmail: "bob@stigi.test", caller: "frontend" as const };

async function twoClusters() {
  await importNotes.run({ csv: "comment\nA\nB\nC\n" }, user);
  const ids = (await loadBoard(OWNER)).unsorted.map((n) => n.id);
  const source = await createCluster.run({ name: "Source", noteIds: [ids[0] ?? "", ids[1] ?? ""] }, user);
  const target = await createCluster.run({ name: "Target", noteIds: [ids[2] ?? ""] }, user);
  return { source: source.id, target: target.id };
}

describe("cluster maintenance", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("merges a cluster into another and records the agent's reason", async () => {
    const { source, target } = await twoClusters();
    const result = await mergeClusters.run({ sourceClusterId: source, targetClusterId: target }, agent);
    expect(result.moved).toBe(2);
    const board = await loadBoard(OWNER);
    expect(board.clusters.map((c) => c.name)).toEqual(["Target"]);
    const merged = board.clusters[0]?.notes ?? [];
    expect(merged).toHaveLength(3);
    expect(merged.filter((n) => n.movedBy === "agent").map((n) => n.reason)).toEqual(['Merged into "Target"', 'Merged into "Target"']);
    await expect(mergeClusters.run({ sourceClusterId: target, targetClusterId: target }, user)).rejects.toThrow(/different clusters/);
  });

  it("deletes a cluster and returns its notes to Unsorted", async () => {
    const { source } = await twoClusters();
    const result = await deleteCluster.run({ clusterId: source }, user);
    expect(result.unsorted).toBe(2);
    const board = await loadBoard(OWNER);
    expect(board.clusters.map((c) => c.name)).toEqual(["Target"]);
    expect(board.unsorted.every((n) => n.movedBy === "user" && n.reason === null)).toBe(true);
    await expect(deleteCluster.run({ clusterId: source }, user)).rejects.toThrow(/Cluster not found/);
  });

  it("resets only the caller's board, report included", async () => {
    await twoClusters();
    await importNotes.run({ csv: "comment\nBob's note\n" }, bob);
    await getDb().insert(schema.stigiReports).values({ ownerEmail: OWNER, markdown: "# r", updatedBy: "user", updatedAt: "2026-11-09T10:00:00.000Z" });
    await resetBoard.run({}, user);
    expect((await loadBoard(OWNER)).totalNotes).toBe(0);
    expect((await loadBoard(OWNER)).clusters).toHaveLength(0);
    expect(await getDb().select().from(schema.stigiReports)).toHaveLength(0);
    expect((await loadBoard("bob@stigi.test")).totalNotes).toBe(1);
  });

  it("clears agent reasons when a cluster is deleted", async () => {
    const { source, target } = await twoClusters();
    const noteId = (await loadBoard(OWNER)).clusters.find((c) => c.id === source)?.notes[0]?.id ?? "";
    await moveNotes.run({ moves: [{ noteId, clusterId: target, reason: "Same theme" }] }, agent);
    await deleteCluster.run({ clusterId: target }, user);
    const back = (await loadBoard(OWNER)).unsorted.find((n) => n.id === noteId);
    expect(back?.reason).toBeNull();
  });
});
