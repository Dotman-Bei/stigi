import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import getAgentUsage from "../../actions/get-agent-usage.js";
import { dailyLimitMessage } from "../../shared/agent-limits.js";
import { resetTestDb } from "../db/test-db.js";
import { dailyAgentTurnLimit, guardAgentTurn, readAgentUsage, utcDay } from "./agent-usage.js";

const OWNER = "ada@stigi.test";
const NOON = new Date("2026-11-09T12:00:00Z");
const NEXT_DAY = new Date("2026-11-10T00:30:00Z");

describe("daily agent-turn cap", () => {
  beforeEach(async () => {
    await resetTestDb();
    vi.stubEnv("STIGI_DAILY_AGENT_TURNS", "3");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses the limit with a default of 40", () => {
    expect(dailyAgentTurnLimit({})).toBe(40);
    expect(dailyAgentTurnLimit({ STIGI_DAILY_AGENT_TURNS: "7" })).toBe(7);
    expect(dailyAgentTurnLimit({ STIGI_DAILY_AGENT_TURNS: "zero" })).toBe(40);
    expect(dailyAgentTurnLimit({ STIGI_DAILY_AGENT_TURNS: "-2" })).toBe(40);
    expect(utcDay(NOON)).toBe("2026-11-09");
  });

  it("refuses the turn over the limit with a friendly 429", async () => {
    for (let i = 0; i < 3; i += 1) await guardAgentTurn({ ownerEmail: OWNER, internalContinuation: false }, NOON);
    const error = await guardAgentTurn({ ownerEmail: OWNER, internalContinuation: false }, NOON).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as { status?: number }).status).toBe(429);
    expect((error as Error).message).toBe(dailyLimitMessage(3));
    expect((error as Error).message).toContain("Demo credits for today are used");
  });

  it("counts neither continuations nor anonymous requests", async () => {
    for (let i = 0; i < 5; i += 1) await guardAgentTurn({ ownerEmail: OWNER, internalContinuation: true }, NOON);
    await guardAgentTurn({ ownerEmail: null, internalContinuation: false }, NOON);
    expect((await readAgentUsage(OWNER, NOON)).used).toBe(0);
  });

  it("reports usage and resets at the next UTC midnight", async () => {
    for (let i = 0; i < 3; i += 1) await guardAgentTurn({ ownerEmail: OWNER, internalContinuation: false }, NOON);
    expect(await readAgentUsage(OWNER, NOON)).toEqual({ used: 3, limit: 3, remaining: 0, resetsAt: "2026-11-10T00:00:00.000Z" });
    expect((await readAgentUsage(OWNER, NEXT_DAY)).remaining).toBe(3);
  });

  it("get-agent-usage returns the signed-in user's usage", async () => {
    const result = await getAgentUsage.run({}, { userEmail: OWNER, caller: "frontend" as const });
    expect(result).toMatchObject({ used: 0, limit: 3, remaining: 3 });
    expect(result.message).toBe("3 of 3 agent turns left today.");
  });
});
