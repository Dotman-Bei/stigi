import { describe, expect, it } from "vitest";

import type { BoardCluster, BoardNote, BoardSnapshot } from "@shared/board-types";

import { allNotes, diffAgentMoves } from "./agent-moves";
import { findAutoTeachCluster } from "./auto-teach";
import {
  NEW_CLUSTER_DROP_ID, UNSORTED_DROP_ID, clusterDropId, noteDragId, noteIdFromDragId, resolveDrop,
} from "./drop-target";
import { buildReportHandoff, buildSortHandoff, buildTeachHandoff } from "./handoff";

function note(id: string, clusterId: string | null, movedBy: BoardNote["movedBy"] = null, body = `note ${id}`): BoardNote {
  return { id, body, source: "sample", clusterId, reason: movedBy === "agent" ? "because" : null, movedBy, movedAt: null, position: 0 };
}
function cluster(id: string, name: string | null, createdBy: BoardCluster["createdBy"], notes: BoardNote[]): BoardCluster {
  return { id, name, createdBy, position: 0, notes };
}
function board(clusters: BoardCluster[], unsorted: BoardNote[] = []): BoardSnapshot {
  const total = unsorted.length + clusters.reduce((s, c) => s + c.notes.length, 0);
  return { clusters, unsorted, totalNotes: total, sampleNotes: total };
}

describe("findAutoTeachCluster", () => {
  it("fires once for a user-made untitled cluster with two or more notes", () => {
    const ready = cluster("c1", null, "user", [note("a", "c1"), note("b", "c1")]);
    const snapshot = board([cluster("c0", "Mobile app", "sample", [note("x", "c0")]), ready]);
    expect(findAutoTeachCluster(snapshot, new Set())?.id).toBe("c1");
    expect(findAutoTeachCluster(snapshot, new Set(["c1"]))).toBeNull();
  });

  it("ignores one-note, named, sample and agent clusters", () => {
    expect(findAutoTeachCluster(board([cluster("c1", null, "user", [note("a", "c1")])]), new Set())).toBeNull();
    expect(findAutoTeachCluster(board([cluster("c1", "Named", "user", [note("a", "c1"), note("b", "c1")])]), new Set())).toBeNull();
    expect(findAutoTeachCluster(board([cluster("c1", null, "agent", [note("a", "c1"), note("b", "c1")])]), new Set())).toBeNull();
    expect(findAutoTeachCluster(board([cluster("c1", null, "sample", [note("a", "c1"), note("b", "c1")])]), new Set())).toBeNull();
  });
});

describe("diffAgentMoves", () => {
  it("returns notes the agent moved between two snapshots", () => {
    const before = board([cluster("c1", "A", "sample", [note("a", "c1")]), cluster("c2", "B", "sample", [])], [note("u", null)]);
    const after = board([
      cluster("c1", "A", "sample", []),
      cluster("c2", "B", "sample", [note("a", "c2", "agent"), note("u", "c2", "user")]),
    ]);
    expect(diffAgentMoves(before, after)).toEqual(["a"]);
    expect(diffAgentMoves(null, after)).toEqual([]);
    expect(allNotes(after).map((n) => n.id)).toEqual(["a", "u"]);
  });
});

describe("handoffs", () => {
  it("carries the cluster id and up to five seeds in hidden context", () => {
    const seeds = Array.from({ length: 7 }, (_, i) => note(`n${i}`, "c9", null, `Seed  text ${i}`));
    const handoff = buildTeachHandoff({ id: "c9", notes: seeds });
    expect(handoff.message).toBe("Teach: name this new cluster and pull in every note that belongs with it.");
    expect(handoff.context).toContain("clusterId=c9");
    expect(handoff.context).toContain('[n0] "Seed text 0"');
    expect(handoff.context).toContain("[n4]");
    expect(handoff.context).not.toContain("[n5]");
    expect(handoff.context).toContain("teach-cluster skill");
  });

  it("asks for one sort batch of at most 25 and for the report", () => {
    expect(buildSortHandoff().message).toBe("Sort the next batch of unsorted notes (up to 25).");
    expect(buildSortHandoff().context).toContain("ONE batch of at most 25");
    expect(buildReportHandoff().context).toContain("write-report skill");
  });
});

describe("resolveDrop", () => {
  it("maps drop targets to actions", () => {
    expect(noteIdFromDragId(noteDragId("n1"))).toBe("n1");
    expect(resolveDrop("n1", "c1", NEW_CLUSTER_DROP_ID)).toEqual({ kind: "create-cluster", noteId: "n1" });
    expect(resolveDrop("n1", "c1", UNSORTED_DROP_ID)).toEqual({ kind: "move", noteId: "n1", clusterId: null });
    expect(resolveDrop("n1", null, UNSORTED_DROP_ID)).toEqual({ kind: "none" });
    expect(resolveDrop("n1", null, clusterDropId("c2"))).toEqual({ kind: "move", noteId: "n1", clusterId: "c2" });
    expect(resolveDrop("n1", "c2", clusterDropId("c2"))).toEqual({ kind: "none" });
    expect(resolveDrop("n1", "c2", null)).toEqual({ kind: "none" });
    expect(resolveDrop("n1", "c2", "something-else")).toEqual({ kind: "none" });
  });
});
