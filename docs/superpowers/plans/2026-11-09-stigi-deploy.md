# Stigi Deploy Implementation Plan

**Goal:** Get a walking skeleton live on Vercel + Neon with Better Auth sign-in in the first build hours, prove the platform's real function-duration limit, then redeploy at three milestones without ever blocking build tasks.
**Architecture:** `nitro.config.ts` gives every Vercel function — and explicitly the agent-chat routes — `maxDuration: 60`. Two Node check scripts gate the build output (durations, daily cron, no key in client assets) and the production env names. Playwright e2e specs sign up a fresh account per run through the framework's auth endpoints and run against the local dev server (`local` project) or the deployed URL (`deployed` project, `STIGI_E2E_TARGET=deployed`). Human-gated tasks (accounts → env → skeleton with probe → probe off → M1/M2/M3) are run by the user or the gate-concierge with consent.
**Tech Stack:** Vercel CLI `65.12.1` (devDependency, `pnpm exec vercel`), Nitro 3 `vercel` preset (`vercel.functions`, `vercel.functionRules`), Neon Postgres (pooled `DATABASE_URL`), `@playwright/test 1.65.0` (chromium), h3 `2.0.8`, Vitest `^4.1.5`.
**Source spec:** docs/superpowers/specs/2026-11-09-stigi-design.md

**Rules for every task in the five Stigi plans:**
- Task numbers are **global** across the five plans (foundation 1–3, deploy 6–13 and 50–52, board 14–33, sort-report 34–42, ship 43–44). A `Depends on` may name a task in another plan.
- Run every command from the repo root in **Git Bash** (POSIX). Never print, echo or commit a secret; env vars are referenced by name only. Never read `.env`.
- TypeScript is strict with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`; never `as any`.
- Every task that touches sample data keeps the "sample" label.
- Step "Commit" is performed by the orchestrator/kernel, never by the executor.

**Deploy-gate rules (spec D8, D9, D16, D17):**
- **No build task depends on any deploy task.** Tasks 10–13 and 50–52 depend only on the code they ship; M1 (Task 50) and M2 (Task 51) gate only themselves; only M3 (Task 52) blocks the submission (Step 3). The orchestrator keeps dispatching build tasks while a human-gated task waits for the user.
- **TRIPWIRE:** if Task 12 (skeleton live and signing in) is not PASS by **build hour ~5** of the orchestrator clock, the orchestrator STOPS dispatching and asks the user whether to downgrade to a local-only demo. No silent grinding. The same stop applies at any time the 45 s duration probe fails.
- **Timing flake rule:** any gate that runs `money-shot.spec.ts` or `sort-batch.spec.ts` has one built-in retry. If the 35 s budget is missed on both attempts, the documented action is: set `AGENT_MODEL=anthropic/claude-haiku-5.5` (local `.env`, and for deployed gates `pnpm exec vercel env rm AGENT_MODEL production --yes` then `printf '%s' 'anthropic/claude-haiku-5.5' | pnpm exec vercel env add AGENT_MODEL production` and redeploy) and re-run the gate. Never rewrite the flow, the batch sizes or the budget.
- **Redeploy recipe** (used by Tasks 12, 13, 50, 51, 52; run by the user or the gate-concierge):
  ```bash
  read -rs DATABASE_URL && export DATABASE_URL      # Neon pooled URL, typed silently, never echoed
  pnpm migrate:production                           # idempotent; applies framework + stigi migrations
  unset DATABASE_URL
  NITRO_PRESET=vercel AGENT_NATIVE_VERCEL_CRON_SCHEDULE="0 9 * * *" pnpm build
  node scripts/check-vercel-output.mjs              # must print VERCEL_OUTPUT_OK
  pnpm exec vercel deploy --prebuilt --prod
  ```

---

### Task 6: Duration probe library and route

**Files:**
- Create: `server/lib/duration-probe.ts`
- Create: `server/routes/api/duration-probe.get.ts`
- Test: `server/lib/duration-probe.test.ts`

**Depends on:** Task 1
**Effort:** low
**Provides:** `clampProbeMs(raw: unknown): number`, `isProbeEnabled(env: ProbeEnv): boolean`, `GET /api/duration-probe?ms=N (404 in production unless STIGI_ENABLE_PROBE=1)`
**Requires:** `@agent-native/core 0.226.0 chat-template app at repo root`

- [ ] **Step 1: Write the failing test**
      Create `server/lib/duration-probe.test.ts`:
      ```ts
      import { describe, expect, it } from "vitest";

      import { clampProbeMs, isProbeEnabled, PROBE_MAX_MS } from "./duration-probe.js";

      describe("clampProbeMs", () => {
        it("parses query strings and numbers and clamps to 0..70000", () => {
          expect(clampProbeMs("45000")).toBe(45000);
          expect(clampProbeMs(58000)).toBe(58000);
          expect(clampProbeMs("999999")).toBe(PROBE_MAX_MS);
          expect(clampProbeMs("-5")).toBe(0);
          expect(clampProbeMs("abc")).toBe(0);
          expect(clampProbeMs(undefined)).toBe(0);
          expect(clampProbeMs("1234.9")).toBe(1234);
        });
      });

      describe("isProbeEnabled", () => {
        it("is always on outside production", () => {
          expect(isProbeEnabled({ NODE_ENV: "development" })).toBe(true);
          expect(isProbeEnabled({})).toBe(true);
        });

        it("is off in production unless STIGI_ENABLE_PROBE is exactly 1", () => {
          expect(isProbeEnabled({ NODE_ENV: "production" })).toBe(false);
          expect(isProbeEnabled({ NODE_ENV: "production", STIGI_ENABLE_PROBE: "0" })).toBe(false);
          expect(isProbeEnabled({ NODE_ENV: "production", STIGI_ENABLE_PROBE: "true" })).toBe(false);
          expect(isProbeEnabled({ NODE_ENV: "production", STIGI_ENABLE_PROBE: "1" })).toBe(true);
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run server/lib/duration-probe.test.ts`
      Expected: FAIL — `Failed to resolve import "./duration-probe.js"`

- [ ] **Step 3: Implement the library and the route**
      Create `server/lib/duration-probe.ts`:
      ```ts
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
      ```
      Create `server/routes/api/duration-probe.get.ts` (the template's `runAuthGuard` middleware already guards `/api/*`; the session check is defence in depth):
      ```ts
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
      ```

- [ ] **Step 4: Run to confirm it passes and the route typechecks (the gate)**
      Run: `pnpm vitest run server/lib/duration-probe.test.ts && pnpm typecheck && echo PROBE_OK`
      Expected: PASS — `Test Files  1 passed (1)` then `PROBE_OK`

- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add the flag-gated duration probe route`

---

### Task 7: Vercel function duration config and build-output check

**Files:**
- Create: `nitro.config.ts`
- Create: `scripts/lib/vercel-output.mjs`
- Create: `scripts/check-vercel-output.mjs`
- Test: `scripts/lib/vercel-output.test.mjs`

**Depends on:** Task 6
**Effort:** medium
**Provides:** `nitro.config.ts vercel maxDuration 60 (agent-chat functionRules)`, `node scripts/check-vercel-output.mjs -> VERCEL_OUTPUT_OK`
**Requires:** `GET /api/duration-probe?ms=N (404 in production unless STIGI_ENABLE_PROBE=1)`

Verified 2026-11-09 against core 0.226.0 / Nitro `3.0.260903-beta`: with this config the Vercel output contains `_agent-native/agent-chat.func`, `_agent-native/agent-chat/[...].func`, `_agent-native/agent-chat-stream.func` and `__server.func`, each with `"maxDuration": 60`, and `config.json` carries the sweep cron.

- [ ] **Step 1: Write the failing test**
      Create `scripts/lib/vercel-output.test.mjs`:
      ```js
      import fs from "node:fs";
      import os from "node:os";
      import path from "node:path";

      import { describe, expect, it } from "vitest";

      import { checkCrons, checkFunctionConfigs, findKeyLeaks, readFunctionConfigs } from "./vercel-output.mjs";

      function writeJson(file, value) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, JSON.stringify(value));
      }

      describe("vercel output checks", () => {
        it("reads every function config and requires >= 60 s on agent-chat and the server", () => {
          const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stigi-vc-"));
          writeJson(path.join(dir, "__server.func/.vc-config.json"), { maxDuration: 60 });
          writeJson(path.join(dir, "_agent-native/agent-chat.func/.vc-config.json"), { maxDuration: 60 });
          writeJson(path.join(dir, "_agent-native/agent-chat-stream.func/.vc-config.json"), { maxDuration: 10 });
          writeJson(path.join(dir, "__server.func/node_modules/pkg/.vc-config.json"), { maxDuration: 1 });
          const configs = readFunctionConfigs(dir);
          expect(configs.map((c) => c.fn).sort()).toEqual([
            "__server.func",
            "_agent-native/agent-chat-stream.func",
            "_agent-native/agent-chat.func",
          ]);
          const result = checkFunctionConfigs(configs);
          expect(result.agentChatCount).toBe(2);
          expect(result.problems).toEqual(["_agent-native/agent-chat-stream.func maxDuration=10 (< 60)"]);
        });

        it("fails when no agent-chat function exists", () => {
          const result = checkFunctionConfigs([{ fn: "__server.func", maxDuration: 60 }]);
          expect(result.problems[0]).toMatch(/no _agent-native\/agent-chat function/);
        });

        it("accepts only a daily sweep cron", () => {
          const sweepPath = "/_agent-native/jobs/_process-sweep";
          expect(checkCrons({ crons: [{ path: sweepPath, schedule: "0 9 * * *" }] })).toEqual([]);
          expect(checkCrons({ crons: [{ path: sweepPath, schedule: "* * * * *" }] })[0]).toMatch(/not daily/);
          expect(checkCrons({})[0]).toMatch(/missing/);
        });

        it("finds an OpenRouter key prefix in client assets", () => {
          const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stigi-static-"));
          fs.mkdirSync(path.join(dir, "assets"), { recursive: true });
          fs.writeFileSync(path.join(dir, "assets/ok.js"), "const label = 'OPENROUTER_API_KEY';");
          fs.writeFileSync(path.join(dir, "assets/bad.js"), "const k = 'sk-or-v1-abc';");
          expect(findKeyLeaks(dir)).toEqual([path.join("assets", "bad.js")]);
          expect(findKeyLeaks(path.join(dir, "missing"))).toEqual([]);
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run scripts/lib/vercel-output.test.mjs`
      Expected: FAIL — `Failed to resolve import "./vercel-output.mjs"`

- [ ] **Step 3: Implement the config, the check library and the CLI**
      Create `nitro.config.ts`:
      ```ts
      import { defineConfig } from "nitro";

      // Agent turns run in 40 s chunks (framework soft timeout); 60 s functions leave headroom.
      // The deployed duration probe (Task 12) confirms what the Vercel plan really allows.
      export default defineConfig({
        vercel: {
          functions: { maxDuration: 60 },
          functionRules: {
            "/_agent-native/agent-chat": { maxDuration: 60 },
            "/_agent-native/agent-chat/**": { maxDuration: 60 },
            "/_agent-native/agent-chat-stream": { maxDuration: 60 },
          },
        },
      });
      ```
      Create `scripts/lib/vercel-output.mjs`:
      ```js
      import fs from "node:fs";
      import path from "node:path";

      export const MIN_AGENT_CHAT_MAX_DURATION = 60;
      export const KEY_PREFIX = "sk-or-";
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
      ```
      Create `scripts/check-vercel-output.mjs`:
      ```js
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
      ```

- [ ] **Step 4: Run the unit tests, a Vercel build and the output check (the gate)**
      Run: `pnpm vitest run scripts/lib/vercel-output.test.mjs && NITRO_PRESET=vercel AGENT_NATIVE_VERCEL_CRON_SCHEDULE="0 9 * * *" pnpm build && node scripts/check-vercel-output.mjs`
      Expected: PASS — `Test Files  1 passed (1)`, `Build complete.`, then `VERCEL_OUTPUT_OK agentChatFunctions=3 maxDuration>=60 cron=daily keyLeaks=0` (about 3 minutes; `.vercel/` is git-ignored)

- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
      Message: `feat: set Vercel function maxDuration for agent-chat and add the build-output check`

---

### Task 8: Vercel CLI and the production env-name check

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `scripts/lib/vercel-env.mjs`
- Create: `scripts/check-vercel-env.mjs`
- Test: `scripts/lib/vercel-env.test.mjs`

**Depends on:** Task 1
**Effort:** low
**Provides:** `pnpm exec vercel (vercel@65.12.1 devDependency)`, `node scripts/check-vercel-env.mjs [--allow-probe] [--require-probe] -> VERCEL_ENV_OK`
**Requires:** `@agent-native/core 0.226.0 chat-template app at repo root`

- [ ] **Step 1: Add the pinned Vercel CLI**
      Run: `pnpm add -D --save-exact vercel@65.12.1`
      Expected: `devDependencies: + vercel 65.12.1`

- [ ] **Step 2: Write the failing test**
      Create `scripts/lib/vercel-env.test.mjs`:
      ```js
      import { describe, expect, it } from "vitest";

      import { checkEnvNames, parseEnvNames, PROBE_FLAG, REQUIRED_PRODUCTION_ENV } from "./vercel-env.mjs";

      const SAMPLE_OUTPUT = [
        "Vercel CLI 65.12.1",
        "> Environment Variables found for dotman/stigi [180ms]",
        "",
        " name                              value               environments        created",
        " DATABASE_URL                      Encrypted           Production          2m ago",
        " BETTER_AUTH_SECRET                Encrypted           Production          2m ago",
        " STIGI_ENABLE_PROBE                Encrypted           Production          1m ago",
      ].join("\n");

      describe("vercel env checks", () => {
        it("parses variable names and never values", () => {
          const names = parseEnvNames(SAMPLE_OUTPUT);
          expect([...names].sort()).toEqual(["BETTER_AUTH_SECRET", "DATABASE_URL", "STIGI_ENABLE_PROBE"]);
        });

        it("reports every missing required name", () => {
          const problems = checkEnvNames(new Set(["DATABASE_URL"]), {});
          expect(problems).toContain("missing BETTER_AUTH_SECRET");
          expect(problems).toContain("missing OPENROUTER_API_KEY");
          expect(problems).not.toContain("missing DATABASE_URL");
        });

        it("rejects the probe flag unless allowed, and can require it", () => {
          const all = new Set([...REQUIRED_PRODUCTION_ENV, PROBE_FLAG]);
          expect(checkEnvNames(all, {})).toEqual([`${PROBE_FLAG} must be removed after the probe check`]);
          expect(checkEnvNames(all, { allowProbe: true })).toEqual([]);
          expect(checkEnvNames(new Set(REQUIRED_PRODUCTION_ENV), { allowProbe: true, requireProbe: true })).toEqual([
            `missing ${PROBE_FLAG} (set it for the skeleton probe step)`,
          ]);
        });

        it("forbids AUTH_DISABLED in production", () => {
          const names = new Set([...REQUIRED_PRODUCTION_ENV, "AUTH_DISABLED"]);
          expect(checkEnvNames(names, {})).toEqual(["forbidden AUTH_DISABLED (sign-in must stay required)"]);
        });
      });
      ```

- [ ] **Step 3: Run to confirm it fails**
      Run: `pnpm vitest run scripts/lib/vercel-env.test.mjs`
      Expected: FAIL — `Failed to resolve import "./vercel-env.mjs"`

- [ ] **Step 4: Implement the library and the CLI**
      Create `scripts/lib/vercel-env.mjs`:
      ```js
      export const REQUIRED_PRODUCTION_ENV = [
        "DATABASE_URL",
        "BETTER_AUTH_SECRET",
        "CRON_SECRET",
        "OPENROUTER_API_KEY",
        "AGENT_ENGINE",
        "AGENT_MODEL",
        "AGENT_ENGINE_PREFER_BYO_KEY",
        "AUTH_REQUIRE_EMAIL_VERIFICATION",
        "STIGI_DAILY_AGENT_TURNS",
        "AGENT_NATIVE_RELEASE_MIGRATIONS",
      ];
      export const PROBE_FLAG = "STIGI_ENABLE_PROBE";
      export const FORBIDDEN_PRODUCTION_ENV = ["AUTH_DISABLED"];

      /** Names from `vercel env ls` output; values are shown as "Encrypted" and are never parsed. */
      export function parseEnvNames(stdout) {
        const names = new Set();
        for (const line of String(stdout).split(/\r?\n/)) {
          const match = line.match(/^\s*([A-Z][A-Z0-9_]{2,})\s{2,}\S/);
          if (match && match[1]) names.add(match[1]);
        }
        return names;
      }

      export function checkEnvNames(names, { allowProbe = false, requireProbe = false } = {}) {
        const problems = [];
        for (const name of REQUIRED_PRODUCTION_ENV) {
          if (!names.has(name)) problems.push(`missing ${name}`);
        }
        for (const name of FORBIDDEN_PRODUCTION_ENV) {
          if (names.has(name)) problems.push(`forbidden ${name} (sign-in must stay required)`);
        }
        if (!allowProbe && names.has(PROBE_FLAG)) problems.push(`${PROBE_FLAG} must be removed after the probe check`);
        if (requireProbe && !names.has(PROBE_FLAG)) problems.push(`missing ${PROBE_FLAG} (set it for the skeleton probe step)`);
        return problems;
      }
      ```
      Create `scripts/check-vercel-env.mjs`:
      ```js
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
      ```

- [ ] **Step 5: Run to confirm it passes (the gate)**
      Run: `pnpm vitest run scripts/lib/vercel-env.test.mjs`
      Expected: PASS — `Test Files  1 passed (1)`

- [ ] **Step 6: Commit (kernel-performed — no agent runs this)**
      Message: `feat: pin the Vercel CLI and add the production env-name check`

---

### Task 9: Playwright setup, auth helper and the skeleton specs

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `playwright.config.ts`
- Create: `e2e/helpers/auth.ts`
- Create: `e2e/deploy-skeleton.spec.ts`
- Create: `e2e/probe-disabled.spec.ts`

**Depends on:** Task 3, Task 6
**Effort:** medium
**Provides:** `playwright projects "local" (dev server :8080) and "deployed" (STIGI_E2E_TARGET=deployed, e2e/production-url.txt)`, `signUpAndSignIn(page: Page, baseURL: string): Promise<TestAccount>`, `e2e/deploy-skeleton.spec.ts (@auth x2, @probe x1)`, `e2e/probe-disabled.spec.ts`
**Requires:** `/board route shell with h1 "Feedback board"`, `GET /api/duration-probe?ms=N (404 in production unless STIGI_ENABLE_PROBE=1)`

- [ ] **Step 1: Add Playwright and download chromium**
      Run: `pnpm add -D --save-exact @playwright/test@1.65.0 && pnpm exec playwright install chromium`
      Expected: `devDependencies: + @playwright/test 1.65.0` and a chromium download that ends without error

- [ ] **Step 2: Write the Playwright config**
      Create `playwright.config.ts`:
      ```ts
      import { existsSync, readFileSync } from "node:fs";

      import { defineConfig, devices } from "@playwright/test";

      const LOCAL_URL = "http://localhost:8080";
      const deployedRun = process.env.STIGI_E2E_TARGET === "deployed";

      function productionUrl(): string {
        const fromEnv = process.env.STIGI_PROD_URL?.trim();
        if (fromEnv) return fromEnv.replace(/\/$/, "");
        if (existsSync("e2e/production-url.txt")) {
          const fromFile = readFileSync("e2e/production-url.txt", "utf8").trim();
          if (fromFile) return fromFile.replace(/\/$/, "");
        }
        return "http://production-url-not-set.invalid";
      }

      export default defineConfig({
        testDir: "./e2e",
        timeout: 120_000,
        expect: { timeout: 30_000 },
        fullyParallel: false,
        workers: 1,
        reporter: [["list"]],
        use: {
          ...devices["Desktop Chrome"],
          viewport: { width: 1920, height: 1400 },
          trace: "retain-on-failure",
        },
        projects: [
          { name: "local", use: { baseURL: LOCAL_URL } },
          { name: "deployed", use: { baseURL: productionUrl() } },
        ],
        ...(deployedRun
          ? {}
          : {
              webServer: {
                command: "pnpm exec agent-native dev --port 8080 --strictPort",
                url: `${LOCAL_URL}/_agent-native/ping`,
                reuseExistingServer: true,
                timeout: 240_000,
                env: {
                  AGENT_NATIVE_DISABLE_AUTO_DEV_ACCOUNT: "1",
                  DO_NOT_TRACK: "1",
                  AGENT_NATIVE_TELEMETRY_DISABLED: "1",
                },
              },
            }),
      });
      ```
      Add to the `"scripts"` object of `package.json` (keep every existing script):
      ```json
      "e2e": "playwright test --project=local",
      "e2e:deployed": "STIGI_E2E_TARGET=deployed playwright test --project=deployed"
      ```

- [ ] **Step 3: Write the auth helper**
      Create `e2e/helpers/auth.ts` (signs up a fresh account per run through the framework's `POST /_agent-native/auth/register` + `/login`; no credentials are stored anywhere):
      ```ts
      import { expect, type Page } from "@playwright/test";

      export interface TestAccount {
        email: string;
        password: string;
      }

      export function newTestAccount(): TestAccount {
        const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        return { email: `stigi-e2e+${stamp}@example.com`, password: `Stigi-e2e-${stamp}-Pw1!` };
      }

      /** Registers and signs in through the page's request context so the browser shares the session cookie. */
      export async function signUpAndSignIn(page: Page, baseURL: string): Promise<TestAccount> {
        const account = newTestAccount();
        const headers = { origin: baseURL, "content-type": "application/json" };
        const register = await page.request.post(`${baseURL}/_agent-native/auth/register`, { data: account, headers });
        expect(register.status(), `register: ${await register.text()}`).toBeLessThan(400);
        const login = await page.request.post(`${baseURL}/_agent-native/auth/login`, { data: account, headers });
        expect(login.status(), `login: ${await login.text()}`).toBeLessThan(400);
        return account;
      }
      ```

- [ ] **Step 4: Write the skeleton specs**
      Create `e2e/deploy-skeleton.spec.ts`:
      ```ts
      import { expect, test } from "@playwright/test";

      import { signUpAndSignIn } from "./helpers/auth";

      test.describe("deploy skeleton", () => {
        test("signed-out visitors meet the sign-in wall, not the board @auth", async ({ page }) => {
          await page.goto("/board");
          await expect(page.locator('input[type="email"]').first()).toBeVisible();
          await expect(page.getByRole("heading", { name: "Feedback board" })).toHaveCount(0);
        });

        test("a fresh account signs up, signs in and reaches the board @auth", async ({ page, baseURL }) => {
          await signUpAndSignIn(page, baseURL ?? "");
          await page.goto("/board");
          await expect(page.getByRole("heading", { name: "Feedback board" })).toBeVisible();
        });

        test("the platform lets a signed-in request run 45 s and 58 s @probe", async ({ page, baseURL }) => {
          test.setTimeout(240_000);
          await signUpAndSignIn(page, baseURL ?? "");
          for (const ms of [45_000, 58_000]) {
            const response = await page.request.get(`${baseURL}/api/duration-probe?ms=${ms}`, { timeout: ms + 30_000 });
            expect(response.status(), `duration probe ${ms} ms`).toBe(200);
            const body = (await response.json()) as { ok: boolean; waitedMs: number };
            expect(body.ok).toBe(true);
            expect(body.waitedMs).toBe(ms);
          }
        });
      });
      ```
      Create `e2e/probe-disabled.spec.ts`:
      ```ts
      import { expect, test } from "@playwright/test";

      import { signUpAndSignIn } from "./helpers/auth";

      test("the duration probe answers 404 on the deployed app once the flag is removed", async ({ page, baseURL }) => {
        test.skip(process.env.STIGI_E2E_TARGET !== "deployed", "Only meaningful against the deployed app");
        await signUpAndSignIn(page, baseURL ?? "");
        const response = await page.request.get(`${baseURL}/api/duration-probe?ms=1000`);
        expect(response.status()).toBe(404);
      });
      ```

- [ ] **Step 5: Run the skeleton spec against the local dev server (the gate)**
      Stop any dev server already listening on port 8080 first (the spec needs the normal sign-in page, which Playwright's server enables with `AGENT_NATIVE_DISABLE_AUTO_DEV_ACCOUNT=1`).
      Known fix (seen in a throwaway 0.226.0 install on this machine, 2026-11-09): if the dev server fails to start with `Could not resolve './hoc'` (or `./hook`, `./config`, `./renderProp`, `./createRef`) in `use-sidecar` / `use-callback-ref`, the install is missing files: run `pnpm install --force` and retry the gate once.
      Run: `pnpm exec playwright test e2e/deploy-skeleton.spec.ts --project=local`
      Expected: PASS — `3 passed` (about 2–3 minutes including dev-server start and the 45 s + 58 s probes)

- [ ] **Step 6: Commit (kernel-performed — no agent runs this)**
      Message: `test: add Playwright projects, the fresh-account auth helper and the deploy skeleton specs`

---

### Task 10: Accounts ready — Neon project and Vercel CLI login (HUMAN GATE)

**Files:**
- (none — local CLI state only; `.vercel/` is git-ignored)

**Depends on:** Task 8
**Effort:** medium
**Model tier:** top
**Provides:** `Vercel CLI logged in and project linked (.vercel/project.json)`, `Neon pooled DATABASE_URL available to the user`
**Requires:** `pnpm exec vercel (vercel@65.12.1 devDependency)`

Human-gated (`gate_profile: account`). The user creates the Neon and Vercel accounts themselves (in parallel with planning); the executor never signs up or logs in.

- [ ] **Step 1: Neon (user)**
      In the Neon console create a project named `stigi` (region closest to the Vercel deployment, e.g. AWS us-east-1), open **Connect**, choose the **pooled** connection, and keep the `postgresql://…-pooler…neon.tech/neondb?sslmode=require` string in a password manager. Do not paste it into chat, a file in the repo, or a terminal command line.

- [ ] **Step 2: Vercel login and link (user)**
      ```bash
      pnpm exec vercel login
      pnpm exec vercel link --yes --project stigi
      ```

- [ ] **Step 3: Verify (the gate)**
      Run: `pnpm exec vercel whoami && test -f .vercel/project.json && echo ACCOUNTS_READY`
      Expected: the Vercel username, then `ACCOUNTS_READY`

- [ ] **Step 4: Commit (kernel-performed — no agent runs this)**
      Message: `chore: accounts ready for the Stigi deploy (no file changes)`

---

### Task 11: Production environment variables (HUMAN GATE)

**Files:**
- (none — values live only in Vercel's production env)

**Depends on:** Task 8, Task 10
**Effort:** medium
**Model tier:** top
**Provides:** `Vercel production env set, including temporary STIGI_ENABLE_PROBE=1`
**Requires:** `Vercel CLI logged in and project linked (.vercel/project.json)`, `node scripts/check-vercel-env.mjs [--allow-probe] [--require-probe] -> VERCEL_ENV_OK`

Human-gated (`gate_profile: secret`). Secrets are typed silently with `read -rs` or generated and piped straight into Vercel; nothing is echoed, logged or written to disk. The OpenRouter key already exists (the user created it with a credit limit); no task creates keys.

- [ ] **Step 1: Set every production variable (user)**
      ```bash
      read -rs DATABASE_URL && printf '%s' "$DATABASE_URL" | pnpm exec vercel env add DATABASE_URL production && unset DATABASE_URL
      node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))" | pnpm exec vercel env add BETTER_AUTH_SECRET production
      node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))" | pnpm exec vercel env add CRON_SECRET production
      read -rs OPENROUTER_API_KEY && printf '%s' "$OPENROUTER_API_KEY" | pnpm exec vercel env add OPENROUTER_API_KEY production && unset OPENROUTER_API_KEY
      printf '%s' 'ai-sdk:openrouter' | pnpm exec vercel env add AGENT_ENGINE production
      printf '%s' 'anthropic/claude-sonnet-5.5' | pnpm exec vercel env add AGENT_MODEL production
      printf '%s' '1' | pnpm exec vercel env add AGENT_ENGINE_PREFER_BYO_KEY production
      printf '%s' '0' | pnpm exec vercel env add AUTH_REQUIRE_EMAIL_VERIFICATION production
      printf '%s' '40' | pnpm exec vercel env add STIGI_DAILY_AGENT_TURNS production
      printf '%s' '1' | pnpm exec vercel env add AGENT_NATIVE_RELEASE_MIGRATIONS production
      printf '%s' '1' | pnpm exec vercel env add STIGI_ENABLE_PROBE production   # temporary: removed in Task 13
      ```
      `AUTH_REQUIRE_EMAIL_VERIFICATION=0` lets judges sign up with email + password without an email provider (each account only sees its own board). Never set `AUTH_DISABLED`.

- [ ] **Step 2: Verify names (the gate)**
      Run: `node scripts/check-vercel-env.mjs --allow-probe --require-probe`
      Expected: `VERCEL_ENV_OK names=11 probe=present` (the count may be higher if Vercel adds system variables; `VERCEL_ENV_OK` and `probe=present` are what matter)

- [ ] **Step 3: Commit (kernel-performed — no agent runs this)**
      Message: `chore: production env configured for Stigi (no file changes)`

---

### Task 12: Deploy the walking skeleton with the probe on (HUMAN GATE, TRIPWIRE)

**Files:**
- Create: `e2e/production-url.txt`

**Depends on:** Task 2, Task 3, Task 7, Task 9, Task 11
**Effort:** medium
**Model tier:** top
**Provides:** `deployed skeleton at the URL in e2e/production-url.txt`
**Requires:** `Vercel production env set, including temporary STIGI_ENABLE_PROBE=1`, `node scripts/check-vercel-output.mjs -> VERCEL_OUTPUT_OK`, `e2e/deploy-skeleton.spec.ts (@auth x2, @probe x1)`, `STIGI_MIGRATIONS: MigrationEntry[]`

Human-gated (`gate_profile: deploy`). **TRIPWIRE:** if this task is not PASS by build hour ~5, the orchestrator stops and asks the user whether to downgrade to a local-only demo. If the 45 s probe fails at any point, stop and ask: the platform would kill agent turns before the framework's 40 s chunk boundary.

- [ ] **Step 1: Migrate, build, check and deploy (user)**
      ```bash
      read -rs DATABASE_URL && export DATABASE_URL
      pnpm migrate:production
      unset DATABASE_URL
      NITRO_PRESET=vercel AGENT_NATIVE_VERCEL_CRON_SCHEDULE="0 9 * * *" pnpm build
      node scripts/check-vercel-output.mjs
      pnpm exec vercel deploy --prebuilt --prod
      ```
      Expected: `VERCEL_OUTPUT_OK …`, then the CLI prints the production URL.

- [ ] **Step 2: Record the stable production URL (user)**
      Write the production alias the CLI printed (`https://<project>.vercel.app`, not the per-deployment hash URL) as the only line of `e2e/production-url.txt`, for example:
      ```bash
      printf '%s\n' "https://stigi.vercel.app" > e2e/production-url.txt
      ```
      (use the alias Vercel actually printed; the URL is public and safe to commit).

- [ ] **Step 3: Run the skeleton spec against production (the gate)**
      Run: `STIGI_E2E_TARGET=deployed pnpm exec playwright test e2e/deploy-skeleton.spec.ts --project=deployed`
      Expected: PASS — `3 passed` (signed-out wall, fresh sign-up reaches "Feedback board", 45 s and 58 s probes return 200)

- [ ] **Step 4: Commit (kernel-performed — no agent runs this)**
      Message: `chore: record the Stigi production URL after the skeleton deploy`

---

### Task 13: Disable the probe and redeploy (HUMAN GATE)

**Files:**
- (none — Vercel env change and redeploy only)

**Depends on:** Task 9, Task 12
**Effort:** medium
**Model tier:** top
**Provides:** `production probe disabled (STIGI_ENABLE_PROBE absent)`
**Requires:** `deployed skeleton at the URL in e2e/production-url.txt`, `e2e/probe-disabled.spec.ts`

Human-gated (`gate_profile: deploy`).

- [ ] **Step 1: Remove the flag and redeploy (user)**
      ```bash
      pnpm exec vercel env rm STIGI_ENABLE_PROBE production --yes
      NITRO_PRESET=vercel AGENT_NATIVE_VERCEL_CRON_SCHEDULE="0 9 * * *" pnpm build
      node scripts/check-vercel-output.mjs
      pnpm exec vercel deploy --prebuilt --prod
      ```

- [ ] **Step 2: Verify the flag is gone, the probe answers 404 and auth still works (the gate)**
      Run: `node scripts/check-vercel-env.mjs && STIGI_E2E_TARGET=deployed pnpm exec playwright test e2e/probe-disabled.spec.ts e2e/deploy-skeleton.spec.ts --project=deployed --grep-invert @probe`
      Expected: `VERCEL_ENV_OK names=10 probe=absent` then `3 passed`

- [ ] **Step 3: Commit (kernel-performed — no agent runs this)**
      Message: `chore: production duration probe disabled (no file changes)`

---

### Task 50: M1 — redeploy the money-shot slice and run the money shot on production (HUMAN GATE)

**Files:**
- (none — redeploy only)

**Depends on:** Task 13, Task 32, Task 33
**Effort:** medium
**Model tier:** top
**Provides:** `M1 deployed: money shot verified on production`
**Requires:** `production probe disabled (STIGI_ENABLE_PROBE absent)`, `e2e/money-shot.spec.ts (live, TURN_BUDGET_MS=35000, retries 1)`

Human-gated (`gate_profile: deploy`). Nothing depends on this task; the orchestrator keeps building while it waits. Runs on the pre-sorted sample layout with no prior sort.

- [ ] **Step 1: Redeploy (user) — the redeploy recipe from this plan's header**
      ```bash
      read -rs DATABASE_URL && export DATABASE_URL
      pnpm migrate:production
      unset DATABASE_URL
      NITRO_PRESET=vercel AGENT_NATIVE_VERCEL_CRON_SCHEDULE="0 9 * * *" pnpm build
      node scripts/check-vercel-output.mjs
      pnpm exec vercel deploy --prebuilt --prod
      ```

- [ ] **Step 2: Run the money shot on production (the gate)**
      Run: `STIGI_E2E_TARGET=deployed pnpm exec playwright test e2e/money-shot.spec.ts --project=deployed`
      Expected: exit code 0 — `1 passed` (or `1 flaky` if the one allowed retry was used). Two misses of the 35 s budget → apply the timing flake rule from this plan's header (switch `AGENT_MODEL` to `anthropic/claude-haiku-5.5`, redeploy, re-run); never change the flow.

- [ ] **Step 3: Commit (kernel-performed — no agent runs this)**
      Message: `chore: M1 deployed and verified on production (no file changes)`

---

### Task 51: M2 — redeploy sort + report and verify them on production (HUMAN GATE)

**Files:**
- (none — redeploy only)

**Depends on:** Task 13, Task 36, Task 38, Task 41, Task 42
**Effort:** medium
**Model tier:** top
**Provides:** `M2 deployed: sort batch and report export verified on production`
**Requires:** `production probe disabled (STIGI_ENABLE_PROBE absent)`, `e2e/sort-batch.spec.ts (live, TURN_BUDGET_MS=35000, retries 1)`, `e2e/report-export.spec.ts`

Human-gated (`gate_profile: deploy`). Nothing depends on this task.

- [ ] **Step 1: Redeploy (user) — the redeploy recipe**
      ```bash
      read -rs DATABASE_URL && export DATABASE_URL
      pnpm migrate:production
      unset DATABASE_URL
      NITRO_PRESET=vercel AGENT_NATIVE_VERCEL_CRON_SCHEDULE="0 9 * * *" pnpm build
      node scripts/check-vercel-output.mjs
      pnpm exec vercel deploy --prebuilt --prod
      ```

- [ ] **Step 2: Verify on production (the gate)**
      Run: `STIGI_E2E_TARGET=deployed pnpm exec playwright test e2e/sort-batch.spec.ts e2e/report-export.spec.ts --project=deployed`
      Expected: exit code 0 — `2 passed` (or `1 flaky` + `1 passed`). Timing flake rule applies to the sort spec.

- [ ] **Step 3: Commit (kernel-performed — no agent runs this)**
      Message: `chore: M2 deployed and verified on production (no file changes)`

---

### Task 52: M3 — final redeploy and the full production suite (HUMAN GATE; blocks submission)

**Files:**
- (none — redeploy only)

**Depends on:** Task 13, Task 44, Task 64
**Effort:** medium
**Model tier:** top
**Provides:** `M3 deployed: full production suite green (submission unblocked)`
**Requires:** `production probe disabled (STIGI_ENABLE_PROBE absent)`, `final local verification: vitest + typecheck + build green`

Human-gated (`gate_profile: deploy`). Only Step 3 (gate-concierge submission) waits on this task.

- [ ] **Step 1: Redeploy (user) — the redeploy recipe**
      ```bash
      read -rs DATABASE_URL && export DATABASE_URL
      pnpm migrate:production
      unset DATABASE_URL
      NITRO_PRESET=vercel AGENT_NATIVE_VERCEL_CRON_SCHEDULE="0 9 * * *" pnpm build
      node scripts/check-vercel-output.mjs
      pnpm exec vercel deploy --prebuilt --prod
      ```

- [ ] **Step 2: Full production suite (the gate)**
      Run: `node scripts/check-vercel-env.mjs && STIGI_E2E_TARGET=deployed pnpm exec playwright test --project=deployed --grep-invert @probe`
      Expected: `VERCEL_ENV_OK … probe=absent`, then exit code 0 — `8 passed` (skeleton @auth ×2, probe-disabled, board-dnd ×2, money-shot, sort-batch, report-export; `flaky` entries from the single allowed retry still exit 0)

- [ ] **Step 3: Commit (kernel-performed — no agent runs this)**
      Message: `chore: M3 final deploy verified on production (no file changes)`
