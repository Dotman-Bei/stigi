export const PROBE_MAX_MS = 70_000;

export interface ProbeEnv {
  NODE_ENV?: string | undefined;
  STIGI_ENABLE_PROBE?: string | undefined;
}

export function clampProbeMs(raw: unknown): number {
  const value = typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : 0;
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.trunc(value), 0), PROBE_MAX_MS);
}

/** Open sign-up + a 70 s sleep would be compute abuse, so production needs an explicit, temporary flag. */
export function isProbeEnabled(env: ProbeEnv): boolean {
  if (env.NODE_ENV !== "production") return true;
  return env.STIGI_ENABLE_PROBE === "1";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
