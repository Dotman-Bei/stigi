import fs from "node:fs";
import path from "node:path";

import { checkCrons, checkFunctionConfigs, findKeyLeaks, readFunctionConfigs } from "./lib/vercel-output.mjs";

const out = path.resolve(".vercel/output");
if (!fs.existsSync(out)) {
  console.error('VERCEL_OUTPUT_FAIL .vercel/output missing; run: NITRO_PRESET=vercel AGENT_NATIVE_VERCEL_CRON_SCHEDULE="0 9 * * *" pnpm build');
  process.exit(1);
}
const { problems, agentChatCount } = checkFunctionConfigs(readFunctionConfigs(path.join(out, "functions")));
problems.push(...checkCrons(JSON.parse(fs.readFileSync(path.join(out, "config.json"), "utf8"))));
for (const leak of findKeyLeaks(path.join(out, "static"))) {
  problems.push(`client asset contains an OpenRouter key prefix: ${leak}`);
}
if (problems.length > 0) {
  for (const problem of problems) console.error(`- ${problem}`);
  console.error("VERCEL_OUTPUT_FAIL");
  process.exit(1);
}
console.log(`VERCEL_OUTPUT_OK agentChatFunctions=${agentChatCount} maxDuration>=60 cron=daily keyLeaks=0`);
