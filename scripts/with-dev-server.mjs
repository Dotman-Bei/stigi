// Usage: node scripts/with-dev-server.mjs "<command 1>" ["<command 2>" ...]
// Reuses a dev server already on :8091, else starts one (its own PGlite folder data/pglite-landing, normal
// sign-in page, no telemetry; :8080 belongs to the main e2e suites, which may run in parallel), runs each
// command in order (stops at the first failure), then stops the server it started. Exit code = the commands'.
import { spawn, spawnSync } from "node:child_process";

const PING = "http://localhost:8091/_agent-native/ping";
const commands = process.argv.slice(2);
if (commands.length === 0) {
  console.error('usage: node scripts/with-dev-server.mjs "<command>" ...');
  process.exit(2);
}

async function up() {
  try {
    return (await fetch(PING)).status < 500;
  } catch {
    return false;
  }
}

let server = null;
function stop() {
  if (!server) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore" });
  else server.kill("SIGTERM");
  server = null;
}

if (!(await up())) {
  server = spawn("pnpm exec agent-native dev --port 8091 --strictPort", {
    shell: true,
    stdio: "ignore",
    env: { ...process.env, DATABASE_URL: "pglite:./data/pglite-landing", AGENT_NATIVE_DISABLE_AUTO_DEV_ACCOUNT: "1", DO_NOT_TRACK: "1", AGENT_NATIVE_TELEMETRY_DISABLED: "1" },
  });
  const deadline = Date.now() + 240_000;
  while (!(await up())) {
    if (Date.now() > deadline) {
      stop();
      console.error("WITH_DEV_SERVER_FAIL: the dev server did not answer on :8091 within 240 s");
      process.exit(1);
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
}

let code = 0;
for (const command of commands) {
  const result = spawnSync(command, { shell: true, stdio: "inherit" });
  if (result.status !== 0) {
    code = result.status ?? 1;
    break;
  }
}
stop();
process.exit(code);
