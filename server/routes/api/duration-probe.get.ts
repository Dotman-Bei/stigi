import { getSession } from "@agent-native/core/server";
import { defineEventHandler, getQuery, HTTPError } from "h3";

import { clampProbeMs, isProbeEnabled, sleep } from "../../lib/duration-probe.js";

export default defineEventHandler(async (event) => {
  if (!isProbeEnabled(process.env)) {
    throw new HTTPError("Not found", { status: 404, statusText: "Not Found" });
  }
  const session = await getSession(event);
  if (!session) {
    throw new HTTPError("Sign in first", { status: 401, statusText: "Unauthorized" });
  }
  const ms = clampProbeMs(getQuery(event).ms);
  const startedAt = Date.now();
  await sleep(ms);
  return { ok: true, waitedMs: ms, elapsedMs: Date.now() - startedAt };
});
