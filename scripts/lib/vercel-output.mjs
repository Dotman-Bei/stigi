import fs from "node:fs";
import path from "node:path";

export const MIN_AGENT_CHAT_MAX_DURATION = 60;
export const KEY_PREFIX = "sk-or-v1-";
export const SWEEP_PATH = "/_agent-native/jobs/_process-sweep";

/** Every .vc-config.json under functionsDir (skipping node_modules) as { fn, maxDuration }. */
export function readFunctionConfigs(functionsDir) {
  const configs = [];
  const walk = (dir, depth) => {
    if (depth > 8) return;
    for (const entry of fs.readdirSync(dir)) {
      if (entry === "node_modules") continue;
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full, depth + 1);
      } else if (entry === ".vc-config.json") {
        const config = JSON.parse(fs.readFileSync(full, "utf8"));
        configs.push({
          fn: path.relative(functionsDir, dir).split(path.sep).join("/"),
          maxDuration: typeof config.maxDuration === "number" ? config.maxDuration : null,
        });
      }
    }
  };
  walk(functionsDir, 0);
  return configs;
}

export function checkFunctionConfigs(configs) {
  const problems = [];
  const tooShort = (c) => c.maxDuration === null || c.maxDuration < MIN_AGENT_CHAT_MAX_DURATION;
  const agentChat = configs.filter((c) => c.fn.startsWith("_agent-native/agent-chat"));
  if (agentChat.length === 0) {
    problems.push("no _agent-native/agent-chat function found (nitro.config.ts functionRules missing?)");
  }
  for (const c of agentChat) {
    if (tooShort(c)) problems.push(`${c.fn} maxDuration=${c.maxDuration} (< ${MIN_AGENT_CHAT_MAX_DURATION})`);
  }
  const server = configs.find((c) => c.fn === "__server.func");
  if (!server) problems.push("__server.func missing");
  else if (tooShort(server)) problems.push(`__server.func maxDuration=${server.maxDuration} (< ${MIN_AGENT_CHAT_MAX_DURATION})`);
  return { problems, agentChatCount: agentChat.length };
}

export function checkCrons(config) {
  const crons = Array.isArray(config?.crons) ? config.crons : [];
  const sweep = crons.find((c) => c?.path === SWEEP_PATH);
  if (!sweep) return ["sweep cron missing from .vercel/output/config.json"];
  const fields = String(sweep.schedule).trim().split(/\s+/);
  const daily =
    fields.length === 5 &&
    /^\d+$/.test(fields[0] ?? "") &&
    /^\d+$/.test(fields[1] ?? "") &&
    fields.slice(2).every((f) => f === "*");
  return daily
    ? []
    : [`sweep cron "${sweep.schedule}" is not daily (Vercel Hobby rejects sub-daily crons); build with AGENT_NATIVE_VERCEL_CRON_SCHEDULE="0 9 * * *"`];
}

export function findKeyLeaks(staticDir) {
  const leaks = [];
  if (!fs.existsSync(staticDir)) return leaks;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && fs.readFileSync(full, "latin1").includes(KEY_PREFIX)) {
        leaks.push(path.relative(staticDir, full));
      }
    }
  };
  walk(staticDir);
  return leaks;
}
