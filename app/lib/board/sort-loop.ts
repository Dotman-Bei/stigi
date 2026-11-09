export interface SortLoopState {
  active: boolean;
  generating: boolean;
  unsortedCount: number;
  remainingTurns: number;
  /** Unsorted count when the last batch was sent; null before the first batch. */
  lastUnsortedCount: number | null;
}

export type SortLoopStep = "wait" | "send" | "stop-done" | "stop-no-progress" | "stop-credits";

/** Spec §8: one batch of ≤ 25 per agent turn; the UI sends the next batch when a turn ends. */
export function nextSortStep(state: SortLoopState): SortLoopStep {
  if (!state.active || state.generating) return "wait";
  if (state.unsortedCount === 0) return "stop-done";
  if (state.lastUnsortedCount !== null && state.unsortedCount >= state.lastUnsortedCount) return "stop-no-progress";
  if (state.remainingTurns <= 0) return "stop-credits";
  return "send";
}
