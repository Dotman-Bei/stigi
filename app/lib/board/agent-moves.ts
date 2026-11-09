import type { BoardNote, BoardSnapshot } from "@shared/board-types";

export function allNotes(board: BoardSnapshot): BoardNote[] {
  return [...board.unsorted, ...board.clusters.flatMap((c) => c.notes)];
}

/** Ids whose cluster changed between two snapshots and whose latest move was the agent's (highlight ring). */
export function diffAgentMoves(prev: BoardSnapshot | null, next: BoardSnapshot): string[] {
  if (!prev) return [];
  const before = new Map<string, string | null>();
  for (const n of allNotes(prev)) before.set(n.id, n.clusterId);
  const moved: string[] = [];
  for (const n of allNotes(next)) {
    if (!before.has(n.id)) continue;
    if (before.get(n.id) !== n.clusterId && n.movedBy === "agent") moved.push(n.id);
  }
  return moved;
}
