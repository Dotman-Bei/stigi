import { describe, expect, it } from "vitest";

import { MONEY_SHOT_SEEDS, SAMPLE_FEEDBACK, SAMPLE_LABEL, SAMPLE_START_CLUSTERS } from "./sample-feedback";

function countBy<T>(items: readonly T[], key: (item: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of items) out[key(item)] = (out[key(item)] ?? 0) + 1;
  return out;
}

describe("sample feedback", () => {
  it("has 200 unique, reasonably sized comments", () => {
    expect(SAMPLE_FEEDBACK).toHaveLength(200);
    const lowered = new Set(SAMPLE_FEEDBACK.map((s) => s.body.toLowerCase()));
    expect(lowered.size).toBe(200);
    for (const s of SAMPLE_FEEDBACK) {
      expect(s.body.length).toBeGreaterThanOrEqual(10);
      expect(s.body.length).toBeLessThanOrEqual(200);
    }
  });

  it("ships a pre-sorted layout: 6 clusters of 25 plus 50 unsorted", () => {
    expect(SAMPLE_START_CLUSTERS).toHaveLength(6);
    const byStart = countBy(SAMPLE_FEEDBACK, (s) => s.start ?? "unsorted");
    for (const name of SAMPLE_START_CLUSTERS) expect(byStart[name]).toBe(25);
    expect(byStart.unsorted).toBe(50);
  });

  it("has the agreed theme distribution", () => {
    expect(countBy(SAMPLE_FEEDBACK, (s) => s.theme)).toEqual({
      "plan-billing": 16, onboarding: 26, mobile: 26, "bank-sync": 26, export: 24,
      notifications: 20, "feature-request": 22, performance: 20, praise: 20,
    });
  });

  it("scatters the plan/billing notes across the board for the money shot", () => {
    const seeds = SAMPLE_FEEDBACK.filter((s) => (MONEY_SHOT_SEEDS as readonly string[]).includes(s.body));
    expect(seeds.map((s) => s.theme)).toEqual(["plan-billing", "plan-billing"]);
    expect(seeds.every((s) => s.start !== null)).toBe(true);
    const others = SAMPLE_FEEDBACK.filter((s) => s.theme === "plan-billing" && !(MONEY_SHOT_SEEDS as readonly string[]).includes(s.body));
    expect(others).toHaveLength(14);
    expect(new Set(others.map((s) => s.start ?? "unsorted")).size).toBeGreaterThanOrEqual(6);
  });

  it("labels the layout as sample data", () => {
    expect(SAMPLE_LABEL).toBe("Sample data · pre-sorted starting layout");
  });
});
