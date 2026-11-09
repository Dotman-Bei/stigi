export const DEFAULT_DAILY_AGENT_TURNS = 40;

/** Shown by the server's 429 and by the UI banner/toast (spec §11, D11). */
export function dailyLimitMessage(limit: number): string {
  return `Demo credits for today are used: each account gets ${limit} agent turns per day. Your board is saved, and dragging, editing and exporting still work. Agent turns reset at 00:00 UTC.`;
}
