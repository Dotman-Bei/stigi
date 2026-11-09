import { execSync } from "node:child_process";

import { checkEnvNames, parseEnvNames } from "./lib/vercel-env.mjs";

const allowProbe = process.argv.includes("--allow-probe");
const requireProbe = process.argv.includes("--require-probe");

let output;
try {
  output = execSync("pnpm exec vercel env ls production 2>&1", { encoding: "utf8" });
} catch {
  console.error("VERCEL_ENV_FAIL could not list production env (logged in and linked? pnpm exec vercel login / link)");
  process.exit(1);
}
const names = parseEnvNames(output);
const problems = checkEnvNames(names, { allowProbe, requireProbe });
if (problems.length > 0) {
  for (const problem of problems) console.error(`- ${problem}`);
  console.error("VERCEL_ENV_FAIL");
  process.exit(1);
}
console.log(`VERCEL_ENV_OK names=${names.size} probe=${names.has("STIGI_ENABLE_PROBE") ? "present" : "absent"}`);
