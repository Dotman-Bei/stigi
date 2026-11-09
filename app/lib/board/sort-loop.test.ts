import { describe, expect, it } from "vitest";

import { nextSortStep, type SortLoopState } from "./sort-loop";

const base: SortLoopState = { active: true, generating: false, unsortedCount: 50, remainingTurns: 10, lastUnsortedCount: null };

describe("nextSortStep", () => {
  it("waits while inactive or while a turn runs", () => {
    expect(nextSortStep({ ...base, active: false })).toBe("wait");
    expect(nextSortStep({ ...base, generating: true })).toBe("wait");
  });

  it("sends the first batch and the next one after progress", () => {
    expect(nextSortStep(base)).toBe("send");
    expect(nextSortStep({ ...base, unsortedCount: 25, lastUnsortedCount: 50 })).toBe("send");
  });

  it("stops when done, when a turn made no progress, or when credits run out", () => {
    expect(nextSortStep({ ...base, unsortedCount: 0, lastUnsortedCount: 25 })).toBe("stop-done");
    expect(nextSortStep({ ...base, unsortedCount: 25, lastUnsortedCount: 25 })).toBe("stop-no-progress");
    expect(nextSortStep({ ...base, remainingTurns: 0 })).toBe("stop-credits");
  });
});
