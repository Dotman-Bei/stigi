import { and, eq, sql } from "drizzle-orm";
import { HTTPError } from "h3";

import { DEFAULT_DAILY_AGENT_TURNS, dailyLimitMessage } from "../../shared/agent-limits.js";
import type { AgentUsage } from "../../shared/board-types.js";
import { getDb, schema } from "../db/index.js";

const turns = schema.stigiAgentTurns;

export function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function nextUtcMidnight(now: Date): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();
}

export function dailyAgentTurnLimit(env: { STIGI_DAILY_AGENT_TURNS?: string | undefined } = process.env): number {
  const raw = env.STIGI_DAILY_AGENT_TURNS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_AGENT_TURNS;
}

export async function readAgentUsage(ownerEmail: string, now: Date = new Date()): Promise<AgentUsage> {
  const limit = dailyAgentTurnLimit();
  const [row] = await getDb().select({ count: turns.count }).from(turns)
    .where(and(eq(turns.ownerEmail, ownerEmail), eq(turns.day, utcDay(now))));
  const used = row?.count ?? 0;
  return { used: Math.min(used, limit), limit, remaining: Math.max(limit - used, 0), resetsAt: nextUtcMidnight(now) };
}

/** Atomic upsert: returns today's count after counting this turn. */
export async function incrementAgentTurns(ownerEmail: string, now: Date = new Date()): Promise<number> {
  const [row] = await getDb().insert(turns)
    .values({ ownerEmail, day: utcDay(now), count: 1 })
    .onConflictDoUpdate({ target: [turns.ownerEmail, turns.day], set: { count: sql`${turns.count} + 1` } })
    .returning({ count: turns.count });
  return row?.count ?? 1;
}

/** Called from the agent-chat plugin's prepareRequest for every new (non-continuation) turn. */
export async function guardAgentTurn(
  details: { ownerEmail: string | null; internalContinuation: boolean },
  now: Date = new Date(),
): Promise<void> {
  if (details.internalContinuation || !details.ownerEmail) return;
  const count = await incrementAgentTurns(details.ownerEmail, now);
  const limit = dailyAgentTurnLimit();
  if (count > limit) {
    throw new HTTPError(dailyLimitMessage(limit), {
      status: 429,
      statusText: "Too Many Requests",
      data: { code: "daily_agent_limit", limit },
    });
  }
}
