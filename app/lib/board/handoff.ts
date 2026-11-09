import type { BoardCluster } from "@shared/board-types";

export interface Handoff {
  message: string;
  context: string;
}

export const MAX_TEACH_SEEDS = 5;
export const SORT_BATCH_SIZE = 25;

function flatten(text: string, maxChars: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > maxChars ? `${flat.slice(0, maxChars - 1)}…` : flat;
}

export function buildTeachHandoff(cluster: Pick<BoardCluster, "id" | "notes">): Handoff {
  const seeds = cluster.notes
    .slice(0, MAX_TEACH_SEEDS)
    .map((n) => `[${n.id}] "${flatten(n.body, 200)}"`)
    .join("; ");
  return {
    message: "Teach: name this new cluster and pull in every note that belongs with it.",
    context: `Stigi teach request. clusterId=${cluster.id}. Seed notes: ${seeds}. Follow the teach-cluster skill.`,
  };
}

export function buildSortHandoff(): Handoff {
  return {
    message: `Sort the next batch of unsorted notes (up to ${SORT_BATCH_SIZE}).`,
    context: `Stigi sort request. Follow the sort-feedback skill. Process ONE batch of at most ${SORT_BATCH_SIZE} unsorted notes, then stop.`,
  };
}

export function buildReportHandoff(): Handoff {
  return {
    message: "Write the insight report from the current board.",
    context: "Stigi report request. Follow the write-report skill.",
  };
}
