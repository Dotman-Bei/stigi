import type { BoardCluster, BoardSnapshot } from "@shared/board-types";

export const AUTO_TEACH_MIN_SEEDS = 2;

/** Spec D7: once per user-made, still-untitled cluster that has reached two seeds. */
export function findAutoTeachCluster(board: BoardSnapshot, firedIds: ReadonlySet<string>): BoardCluster | null {
  for (const cluster of board.clusters) {
    if (cluster.createdBy !== "user") continue;
    if (cluster.name !== null) continue;
    if (cluster.notes.length < AUTO_TEACH_MIN_SEEDS) continue;
    if (firedIds.has(cluster.id)) continue;
    return cluster;
  }
  return null;
}
