# Stigi Landing Page Implementation Plan

**Goal:** Add a public marketing landing page at `/` built with the full design-taste-frontend workflow (dealt hero, sections, real screenshots of the running board, one detail photograph, an optional moment, the skill's checkers), while `/board` stays behind sign-in.
**Architecture:** The landing is a skill-native static page (`public/landing/index.html` + copied kit assets under `public/landing/assets/`). `scripts/build-landing.mjs` compiles the HTML into `server/landing/landing-html.ts`, which the scaffold's existing Nitro route `server/routes/index.get.ts` returns for `/` (outside React Router, so no app shell). The auth plugin stops serving the sign-in page at `/` (`rootAuth: false`) and allow-lists exactly `/` and `/landing/*`; every other page keeps the sign-in wall. Landing e2e specs live in `e2e-landing/*.e2e.ts` with their own `playwright.landing.config.ts`, so the existing suites and their gates are untouched.
**Tech Stack:** `@agent-native/core 0.226.0` (Nitro 3 server routes, h3 `2.0.8`, toolkit `createToolkitAuthPlugin`), the design-taste-frontend kit at `docs/design/frontend-kit/` (`system.css/js`, `ui/cards.css`, `motion`, `layout`, `diagrams`, `moments/iris-opens`, `scripts/photos.mjs`, `scripts/consistency.mjs`, `assets/layout/check.mjs`, `scripts/moments.mjs`), Google Fonts (Host Grotesk, JetBrains Mono), Vitest `^4.1.5`, `@playwright/test 1.65.0`, system Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe` (the kit checkers' browser).
**Source spec:** docs/superpowers/specs/2026-11-09-stigi-design.md

**Rules for every task in the six Stigi plans:**
- Task numbers are **global** (foundation 1–3, deploy 6–13 and 50–52, board 14–33, sort-report 34–42, ship 43–44, landing 60–64). A `Depends on` may name a task in another plan.
- **Additive plan (spec §18, D18):** the landing never edits a file another plan's pending task touches. It modifies only two scaffold files no other task changes (`server/plugins/auth.ts`, `server/routes/index.get.ts`); everything else is new under `public/landing/`, `server/landing/`, `e2e-landing/`, `scripts/` (new files only) and `playwright.landing.config.ts`.
- Run every command from the repo root in **Git Bash** (POSIX). Never print, echo or commit a secret. Never read `.env`.
- TypeScript is strict with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`; never `as any`.
- UI work follows `docs/design/frontend.md` with `docs/design/frontend-kit/` as `<skill>`: read `references/copy.md`, `references/system.md`, `references/layout-v4.md`, `references/sections.md` in full before building, then each recipe id used in `references/sections-library.md`. Copy kit files into `public/landing/assets/`; never edit the kit's own files (the copies are kit files too: never edit them to clear a check).
- **Honesty (spec D19, Rules: entries must be "truthful"; "fabricated demonstrations" disqualify):** the landing is product-UI-led. Its product pictures are real screenshots of the running app with the labelled sample data and the "Sample data" chip visible (spec D21: no mock-ups, no drawn stand-ins), plus one diagram card and one library detail photograph with its credit. **No** testimonials, quotes from people, customer logos, invented statistics, ratings or photographs of people. Every number on the page is a true product fact (200 sample comments, 40 agent turns a day, 25 notes per sort batch, 500 notes per board).
- **Cut order (spec D12, amended):** stretch → landing moments/scenes (Task 63) → merge/delete polish → CSV edge cases. Never cut the money shot, the deploy skeleton, the report, the tests, or the landing hero + CTA once built. Task 63 is optional: it depends on Task 62 and no task depends on it, so cutting it means not dispatching it.
- Step "Commit" is performed by the orchestrator/kernel, never by the executor.

**The landing page plan (dealt 2026-11-09 by the architect with the kit's scripts; build exactly this):**
- Line 1 — kind: **software** (`<html data-type="software">`, `<meta name="page-type" content="software">`, `<meta name="site-kind" content="software">`).
- Line 2 — deal: palette `olive-on-bone`, type `host`, radius `soft` (the board's deal, spec §10, `start.mjs`); hero **`split`** (`assets/layout/deal.mjs --type software --has ui`: text `span-5` left, one real board screenshot `span-6 start-7` right, one float card); nav **`nav-centre`**; footer **`footer-statement`**; close **`close-type`**; rhythm **`dark-band`**; buttons **`pill`** (`<html data-buttons="pill">`); mark **`ring`** (`data-mark="ring"`); lit ground **`sky`** (`<html data-ground="sky">`); CSS grounds: none; shader effect: none (the real board screenshot is the hero's picture); moment **`iris-opens`** on the dark band (`moments.mjs pick --page software --count 1`, Task 63); library photograph **`d183`** (`photos.mjs pick --trade office --sections notebook`: an open notebook and pencil, CC0, a detail slot).
- Sections (each one screen at 1440×900; `main > section`, one `.wrap`, its h2 first):

  | # | id | recipe | one idea | picture (kind) |
  |---|---|---|---|---|
  | 1 | `top` | hero `split` | a feedback board product teams sort with an agent | screenshot `board-hero.jpg`: the real board with the sample data and its chip, plus the float card (ui, real) |
  | 2 | `how` | `app-frame` | one board for every comment; the agent works through the same actions | screenshot `board-overview.jpg`: the whole board, wide (ui, real) |
  | 3 | `teach` | `split-text-left` | teach by dragging, not prompting | screenshot `board-teach.jpg`: two seed notes dragged into a new Untitled cluster (ui, real) |
  | 4 | `steps` | `steps` | from raw comments to a report in four steps | screenshot `board-selection.jpg`: two notes selected, the selection bar's More like these (ui, real) |
  | 5 | `actions` | dark band (`.ground-inverse`) | one action layer for you and the agent | a `lanes` diagram card (diagram) — the `iris-opens` moment (Task 63) |
  | 6 | `by-hand` | split, photograph on the left | affinity sorting without the afternoon | photograph `d183` (detail) |
  | 7 | `faq` | `faq` | questions about Stigi (the calm section) | none (an FAQ is allowed one picture-less section) |
  | — | `footer.closing` | `close-type` + `footer-statement` | sort your feedback with an agent | the big button + the name |

- Main action, word for word, as a filled pill button in exactly three places (nav, hero, close): **`Try Stigi`** → `href="/board"` (signed-out visitors meet the sign-in screen there and return to their board after signing in). The secondary hero button is `See how it works` → `#how`. No other filled buttons.

**Copy (verbatim; write it exactly):**
- `<title>`: `Stigi: the feedback board for product teams` · meta description: `Stigi sorts hundreds of customer comments into themes with an agent. Drag two notes to correct it and it re-sorts the rest, then writes the insight report.`
- Nav: logo `Stigi` (ring mark) → `#top`; links `How it works` (`#how`), `Teach by dragging` (`#teach`), `FAQ` (`#faq`); button `Try Stigi`.
- Hero: kicker `Free to try · 40 agent turns a day` · h1 `The feedback board for product teams` · lead `Drop in hundreds of customer comments and an agent sorts them into themes. Drag two notes to correct it, and it re-sorts the rest to match.` · buttons `Try Stigi`, `See how it works`.
  - Hero picture `board-hero.jpg`, alt `Stigi's board with the labelled sample data loaded: the New cluster zone, the Unsorted tray and the starting themes`.
  - Float card (true facts of the sample shown): row `Sample data` · `pre-sorted`; title `200 comments, six starting themes, 50 unsorted`.
- `how` — h2 `One board for every comment.` with muted span ` The agent files them; you steer.` · paragraph `Every comment is a note and every theme a cluster. The agent reads the board through the same actions you use, so its moves land on your screen while it works.` with one `.link` `Try it on the sample board` → `/board`.
  - Picture `board-overview.jpg`, alt `The whole Stigi board: the sample comments sorted into starting themes beside the Unsorted tray`.
- `teach` — h2 `Teach by dragging, not prompting` · three short paragraphs (not a check-icon list): `Drag a note onto New cluster, then drop a second note beside it.` / `The agent names the theme and pulls every matching note in from across the board.` / `Each note it moves shows a one-line reason, and your own drags always win.` · picture `board-teach.jpg`, alt `Two notes dragged into a new Untitled cluster, the moment before the agent names it`.
- `steps` — h2 `From raw comments to a report in four steps` · `Import a CSV` — `Paste or upload up to 500 comments, or load the sample board in one click.` · `Sort with agent` — `The agent files the unsorted pile in batches of 25, with a reason on every move.` · `Teach by dragging` — `Two notes in a new cluster are enough to show it a theme.` · `Write the report` — `The agent ranks the themes with verbatim quotes; you edit it and export Markdown.` · picture `board-selection.jpg`, alt `Two notes selected on the board, with the selection bar offering More like these`.
- `actions` (dark band) — h2 `One action layer for you and the agent` · `A drag on the board and an agent tool call run the same move-notes action, with the same checks. Stigi is built on the Agent-Native framework: shared actions, shared data and shared app state.`
  - Diagram (`<div class="panel"><div class="dg" data-diagram><script type="application/json">…</script></div></div>`, `references/diagrams.md`): `{"layout":"lanes","alt":"A drag on the board and an agent tool call both run the same move-notes action, which saves the board, records the reason and refreshes your screen.","input":{"label":"You drag a note","icon":"ui:user","sub":"or the agent calls a tool"},"core":{"label":"move-notes","icon":"ui:layers"},"lanes":[{"label":"Board saved","icon":"ui:database","done":true,"sub":"Postgres"},{"label":"Reason recorded","icon":"ui:message-square","done":true,"sub":"One line per move"},{"label":"Screen refreshed","icon":"ui:refresh-cw","done":true,"sub":"Live sync"}]}`
- `by-hand` — h2 `Affinity sorting without the afternoon` · `Product teams sort feedback by hand with sticky notes and spreadsheets, and by the time the themes are named they are out of date. Stigi keeps the board live: correct one grouping and the rest follows.`
- `faq` — h2 `Questions about Stigi` · Q `What data does the demo use?` A `Every board starts empty. One click loads 200 synthetic sample comments for a fictional expenses app, labelled in the app. You can also import your own CSV.` · Q `Which model sorts the notes?` A `Claude Sonnet 5.5 through OpenRouter, inside the Agent-Native agent chat. The agent changes the board only through Stigi's actions.` · Q `Does the agent learn my preferences?` A `Your drags steer the board you are working on. Stigi does not train a model or carry corrections between sessions.` · Q `How much can I use it?` A `Each account gets 40 agent turns a day; dragging, editing and exporting are unlimited.` · Q `Can I take the results with me?` A `The insight report exports as a Markdown file you can paste anywhere.` · Q `Who built it?` A `A solo builder working with Claude Code, during the Agent-Native Hackathon by Builder.io in November 2026.`
- Close — h2 `Sort your feedback with an agent` · big button `Try Stigi`.
- Footer (statement ground) — logo `Stigi` · line `Built at the Agent-Native Hackathon by Builder.io, November 2026.` · text links `How it works` (`#how`), `Teach by dragging` (`#teach`), `FAQ` (`#faq`), `Open the board` (`/board`) · the one credits line (a `details.credits`, footer only): summary `Photograph: Jan Kahánek via Wikimedia Commons (CC0) · Fonts: Host Grotesk and JetBrains Mono via Google Fonts (SIL Open Font License)`.

---

### Task 60: Public landing route at `/` with `/board` still behind sign-in

**Files:**
- Modify: `server/plugins/auth.ts`
- Modify: `server/routes/index.get.ts`
- Create: `server/landing/landing-html.ts`
- Create: `scripts/lib/landing-html.mjs`
- Create: `scripts/build-landing.mjs`
- Create: `scripts/with-dev-server.mjs`
- Create: `public/landing/index.html`
- Create: `playwright.landing.config.ts`
- Create: `e2e-landing/landing-public.e2e.ts`
- Test: `scripts/lib/landing-html.test.mjs`

**Depends on:** Task 3, Task 9, Task 26
**Effort:** high
**Model tier:** top
**Provides:** `GET / serves public/landing/index.html publicly (auth allowlist: exactly "/" and "/landing/*"; /board stays behind sign-in)`, `node scripts/build-landing.mjs [--check] -> LANDING_MODULE_OK`, `node scripts/with-dev-server.mjs "<command>"... (runs commands against a dev server on :8091)`, `playwright.landing.config.ts (testDir e2e-landing, *.e2e.ts, projects local :8091 / deployed)`, `e2e-landing/landing-public.e2e.ts (2 tests)`
**Requires:** `/board route shell with h1 "Feedback board"`, `playwright projects "local" (dev server :8080) and "deployed" (STIGI_E2E_TARGET=deployed, e2e/production-url.txt)`, `app/styles/stigi-tokens.css (olive-on-bone, Host Grotesk + JetBrains Mono, scoped .stigi-route/.stigi)`

Security-sensitive (it changes the auth guard's allowlist). Verified 2026-11-09 against core 0.226.0 in a throwaway scaffold: with `rootAuth: true` the guard answers an HTML request for `/` with the sign-in page; with `rootAuth: false` + `publicPaths: ["/", "/landing"]` a signed-out `GET /` reaches `server/routes/index.get.ts` (200 `text/html`) and `public/landing/*` (`.css`, `.js`, `.json`, `.webp`, `.html`) serves 200 signed-out. The guard's `matchesPathList` treats `"/"` as an exact match (`path === "/" || path.startsWith("//")`), so no other path becomes public. Page documents such as `/board` render an anonymous SSR shell and the client gate shows the sign-in screen, exactly as before. Current file contents being replaced (from the scaffold):
```ts
// server/plugins/auth.ts
import { createToolkitAuthPlugin } from "@agent-native/toolkit/app/auth/server";

export default createToolkitAuthPlugin({
  workspaceAppPublicPaths: ["/"],
  rootAuth: true,
  marketing: false,
});
// server/routes/index.get.ts
export { default } from "./[...page].get";
```

- [ ] **Step 1: Write the failing tests**
      Create `scripts/lib/landing-html.test.mjs`:
      ```js
      import { describe, expect, it } from "vitest";

      import { LANDING_MODULE, LANDING_SOURCE, toLandingModule } from "./landing-html.mjs";

      describe("landing module", () => {
        it("embeds the page as one exported string literal", () => {
          const html = '<!doctype html>\n<p class="x">It\'s "quoted" & `ticked` ${not} \\ done</p>\n';
          const module = toLandingModule(html);
          expect(module.startsWith("// GENERATED by scripts/build-landing.mjs")).toBe(true);
          const literal = module.slice(module.indexOf("= ") + 2, module.lastIndexOf(";"));
          expect(JSON.parse(literal)).toBe(html);
          expect(module).toContain("export const LANDING_HTML = ");
        });

        it("points at the source page and the generated module", () => {
          expect(LANDING_SOURCE).toBe("public/landing/index.html");
          expect(LANDING_MODULE).toBe("server/landing/landing-html.ts");
        });
      });
      ```
      Create `playwright.landing.config.ts`:
      ```ts
      import { existsSync, readFileSync } from "node:fs";

      import { defineConfig, devices } from "@playwright/test";

      const LOCAL_URL = "http://localhost:8091";
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

      // Landing specs are *.e2e.ts in e2e-landing/ so the existing e2e suites (and Vitest) never pick them up.
      export default defineConfig({
        testDir: "./e2e-landing",
        testMatch: "**/*.e2e.ts",
        timeout: 90_000,
        expect: { timeout: 30_000 },
        fullyParallel: false,
        workers: 1,
        reporter: [["list"]],
        use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, trace: "retain-on-failure" },
        projects: [
          { name: "local", use: { baseURL: LOCAL_URL } },
          { name: "deployed", use: { baseURL: productionUrl() } },
        ],
        ...(deployedRun
          ? {}
          : {
              webServer: {
                command: "pnpm exec agent-native dev --port 8091 --strictPort",
                url: `${LOCAL_URL}/_agent-native/ping`,
                reuseExistingServer: true,
                timeout: 240_000,
                env: { DATABASE_URL: "pglite:./data/pglite-landing", AGENT_NATIVE_DISABLE_AUTO_DEV_ACCOUNT: "1", DO_NOT_TRACK: "1", AGENT_NATIVE_TELEMETRY_DISABLED: "1" },
              },
            }),
      });
      ```
      Create `e2e-landing/landing-public.e2e.ts`:
      ```ts
      import { expect, test } from "@playwright/test";

      test("a signed-out GET / is 200 and shows the public landing page", async ({ page, request, baseURL }) => {
        const response = await request.get(`${baseURL}/`, { headers: { accept: "text/html" }, maxRedirects: 0 });
        expect(response.status()).toBe(200);
        expect(response.headers()["content-type"]).toContain("text/html");
        expect(await response.text()).toContain('data-page="stigi-landing"');
        await page.goto("/");
        await expect(page.getByRole("heading", { level: 1 })).toHaveText("The feedback board for product teams");
        await expect(page.locator('a[href="/board"]', { hasText: "Try Stigi" }).first()).toBeVisible();
        await expect(page.locator('input[type="email"]')).toHaveCount(0);
      });

      test("a signed-out visit to /board still lands on the sign-in screen", async ({ page }) => {
        await page.goto("/board");
        await expect(page.locator('input[type="email"]').first()).toBeVisible();
        await expect(page.getByRole("heading", { name: "Feedback board" })).toHaveCount(0);
      });
      ```

- [ ] **Step 2: Run to confirm they fail**
      Run: `pnpm vitest run scripts/lib/landing-html.test.mjs`
      Expected: FAIL — `Failed to resolve import "./landing-html.mjs"`

- [ ] **Step 3: Write the build pipeline and the dev-server helper**
      Create `scripts/lib/landing-html.mjs`:
      ```js
      export const LANDING_SOURCE = "public/landing/index.html";
      export const LANDING_MODULE = "server/landing/landing-html.ts";

      /** The landing page as a TypeScript module the "/" route returns (no runtime file reads on serverless). */
      export function toLandingModule(html) {
        return `// GENERATED by scripts/build-landing.mjs from ${LANDING_SOURCE}. Do not edit: edit the HTML and re-run the script.\nexport const LANDING_HTML = ${JSON.stringify(html)};\n`;
      }
      ```
      Create `scripts/build-landing.mjs`:
      ```js
      import fs from "node:fs";
      import path from "node:path";

      import { LANDING_MODULE, LANDING_SOURCE, toLandingModule } from "./lib/landing-html.mjs";

      const normalise = (text) => text.replace(/\r\n/g, "\n");
      const expected = toLandingModule(normalise(fs.readFileSync(LANDING_SOURCE, "utf8")));

      if (process.argv.includes("--check")) {
        const actual = fs.existsSync(LANDING_MODULE) ? normalise(fs.readFileSync(LANDING_MODULE, "utf8")) : "";
        if (actual !== expected) {
          console.error("LANDING_MODULE_STALE: run node scripts/build-landing.mjs after editing public/landing/index.html");
          process.exit(1);
        }
        console.log("LANDING_MODULE_OK");
      } else {
        fs.mkdirSync(path.dirname(LANDING_MODULE), { recursive: true });
        fs.writeFileSync(LANDING_MODULE, expected);
        console.log("LANDING_MODULE_OK written");
      }
      ```
      Create `scripts/with-dev-server.mjs`:
      ```js
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
      ```

- [ ] **Step 4: Write the first real landing page (replaced by Task 61) and compile it**
      Create `public/landing/index.html`:
      ```html
      <!doctype html>
      <html lang="en" data-type="software" data-page="stigi-landing">
      <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Stigi: the feedback board for product teams</title>
      <meta name="description" content="Stigi sorts hundreds of customer comments into themes with an agent. Drag two notes to correct it and it re-sorts the rest, then writes the insight report.">
      <meta name="page-type" content="software">
      <meta name="site-kind" content="software">
      <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@400..700&family=JetBrains+Mono:wght@400..500&display=swap" rel="stylesheet">
      <style>
      :root { --p-bg: #ecebe7; --p-ink: #38450f; --p-muted: #5a6537; --p-action: #38450f; --p-action-ink: #ecebe7;
              --font-display: "Host Grotesk", system-ui, sans-serif; --font-text: "Host Grotesk", system-ui, sans-serif; }
      body { margin: 0; background: var(--p-bg); color: var(--p-ink); font-family: var(--font-text); }
      main { max-width: 1280px; margin: 0 auto; padding: 120px 24px; }
      h1 { font-family: var(--font-display); font-weight: 500; letter-spacing: -0.035em; font-size: clamp(38px, 3.24vw + 25.4px, 72px); line-height: 1.02; max-width: 12ch; margin: 0 0 24px; }
      p { font-size: 20px; line-height: 1.5; max-width: 42ch; color: var(--p-muted); }
      a.cta { display: inline-flex; align-items: center; height: 44px; padding: 0 24px; border-radius: 999px; background: var(--p-action); color: var(--p-action-ink); text-decoration: none; font-weight: 500; }
      </style>
      </head>
      <body>
      <main id="top">
        <h1>The feedback board for product teams</h1>
        <p>Drop in hundreds of customer comments and an agent sorts them into themes. Drag two notes to correct it, and it re-sorts the rest to match.</p>
        <a class="cta" href="/board">Try Stigi</a>
      </main>
      </body>
      </html>
      ```
      Run: `node scripts/build-landing.mjs`
      Expected: `LANDING_MODULE_OK written` (creates `server/landing/landing-html.ts`; never edit it by hand)

- [ ] **Step 5: Serve the landing at `/` and open the allowlist**
      Replace the whole of `server/routes/index.get.ts` with:
      ```ts
      import { defineEventHandler } from "h3";

      import { LANDING_HTML } from "../landing/landing-html.js";

      // Public landing page (spec §18): static HTML built with docs/design/frontend.md, compiled by
      // scripts/build-landing.mjs. Every other page still renders through the React Router SSR handler.
      export default defineEventHandler(
        () =>
          new Response(LANDING_HTML, {
            headers: {
              "content-type": "text/html; charset=utf-8",
              "cache-control": "public, max-age=0, must-revalidate",
            },
          }),
      );
      ```
      Replace the whole of `server/plugins/auth.ts` with:
      ```ts
      import { createToolkitAuthPlugin } from "@agent-native/toolkit/app/auth/server";

      export default createToolkitAuthPlugin({
        workspaceAppPublicPaths: ["/"],
        // "/" is the public landing page (spec §18) instead of the sign-in page. Only "/" (exact) and the
        // landing's static files under /landing are public; /board and every other page keep the sign-in wall.
        rootAuth: false,
        publicPaths: ["/", "/landing"],
        marketing: false,
      });
      ```

- [ ] **Step 6: Run the unit test, the freshness check, typecheck and the public-route e2e (the gate)**
      The landing uses its own port 8091 and its own local database folder (`data/pglite-landing`, git-ignored), so it never collides with the main e2e suites on :8080 that sort-report runs in parallel.
      Known fix: if the dev server fails to start with `Could not resolve './hoc'` (or `./hook`, `./config`, `./createRef`) in `use-sidecar` / `use-callback-ref`, the install is missing files: run `pnpm install --force` and retry the gate once.
      Run: `pnpm vitest run scripts/lib/landing-html.test.mjs && node scripts/build-landing.mjs --check && pnpm typecheck && pnpm exec playwright test --config playwright.landing.config.ts e2e-landing/landing-public.e2e.ts --project=local`
      Expected: PASS — `Tests  2 passed (2)`, `LANDING_MODULE_OK`, then `2 passed`

- [ ] **Step 7: Commit (kernel-performed — no agent runs this)**
      Message: `feat: serve a public landing page at / and keep /board behind sign-in`

---

### Task 61: Real board screenshots and the landing page built with the design skill

**Files:**
- Modify: `public/landing/index.html`
- Modify: `server/landing/landing-html.ts`
- Create: `public/landing/landing.css`
- Create: `e2e-landing/capture-screenshots.e2e.ts`
- Create: `public/landing/assets/shots/board-hero.jpg`
- Create: `public/landing/assets/shots/board-overview.jpg`
- Create: `public/landing/assets/shots/board-teach.jpg`
- Create: `public/landing/assets/shots/board-selection.jpg`
- Create: `public/landing/assets/system.css`
- Create: `public/landing/assets/system.js`
- Create: `public/landing/assets/ui/cards.css`
- Create: `public/landing/assets/ui/ui.js`
- Create: `public/landing/assets/motion/motion.css`
- Create: `public/landing/assets/motion/motion.js`
- Create: `public/landing/assets/layout/layout.css`
- Create: `public/landing/assets/layout/layout.js`
- Create: `public/landing/assets/diagrams/diagram.css`
- Create: `public/landing/assets/diagrams/diagram.js`
- Create: `public/landing/assets/diagrams/mount.js`
- Create: `public/landing/assets/diagrams/presets.json`
- Create: `public/landing/assets/img/photo-d183.webp`
- Create: `public/landing/assets/img/photo-d183-500.webp`
- Create: `public/landing/assets/img/photo-d183-960.webp`
- Create: `public/landing/assets/img/credits.json`
- Create: `public/landing/assets/icons/ui-user.svg`
- Create: `public/landing/assets/icons/ui-layers.svg`
- Create: `public/landing/assets/icons/ui-database.svg`
- Create: `public/landing/assets/icons/ui-message-square.svg`
- Create: `public/landing/assets/icons/ui-refresh-cw.svg`
- Create: `public/landing/assets/icons/icons-credits.json`
- Test: `scripts/lib/landing-content.test.mjs`

**Depends on:** Task 31, Task 60
**Effort:** high
**Provides:** `public/landing/index.html (skill-built landing: kind software, dealt hero split, 7 sections + close/footer, verbatim copy, honest pictures)`, `public/landing/assets/shots/*.jpg (4 real screenshots of the running board, sample data loaded, "Sample data" chip visible)`
**Requires:** `GET / serves public/landing/index.html publicly (auth allowlist: exactly "/" and "/landing/*"; /board stays behind sign-in)`, `node scripts/build-landing.mjs [--check] -> LANDING_MODULE_OK`, `playwright.landing.config.ts (testDir e2e-landing, *.e2e.ts, projects local :8091 / deployed)`, `<BoardPage /> (data-agent-state, 2 s polling while the agent runs, DnD, glide-in, selection app-state, auto-teach)`

UI task: applies `docs/design/frontend.md` (the whole run for a **software** page; `<skill>` = `docs/design/frontend-kit/`) and builds exactly the page plan, deal and copy in this plan's header. **Pictures are real screenshots of the running app (spec D21): no mock-ups, no drawn stand-ins, no `.ui` windows or kit UI fragments.** The four screenshots are captured from the local dev server with the sample data loaded and the "Sample data · pre-sorted starting layout" chip visible; with auto-teach off no agent turn runs, so no key is needed. The one other picture is the library detail photograph `d183`, plus the diagram card. No testimonials, logos, statistics or people.

Board markup used by the capture (from board Tasks 29–31, which Task 31 ships): the empty board's button `Load sample data (200 notes)`; the chip text `Sample data · pre-sorted starting layout`; cards `[data-note-id]`; columns `section[data-cluster-name="<name>"]` (a new user cluster is `Untitled`); the New-cluster zone `[data-testid="new-cluster-zone"]`; clicking a card selects it and the selection bar reads `2 selected`; `localStorage["stigi.autoTeach"] = "0"` turns auto-teach off. The capture signs up a fresh account through `POST /_agent-native/auth/register` + `/_agent-native/auth/login` (body `{ email, password }`).

- [ ] **Step 1: Write the failing content test**
      Create `scripts/lib/landing-content.test.mjs`:
      ```js
      import fs from "node:fs";

      import { describe, expect, it } from "vitest";

      const html = fs.readFileSync("public/landing/index.html", "utf8");
      const text = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ");
      const imgs = html.match(/<img\b[^>]*>/g) ?? [];
      const SHOTS = ["board-hero.jpg", "board-overview.jpg", "board-teach.jpg", "board-selection.jpg"];

      describe("landing page", () => {
        it("declares the software kind and the dealt system", () => {
          expect(html).toMatch(/<html[^>]*\sdata-type="software"/);
          expect(html).toMatch(/<html[^>]*\sdata-page="stigi-landing"/);
          expect(html).toMatch(/<html[^>]*\sdata-radius="soft"/);
          expect(html).toMatch(/<html[^>]*\sdata-buttons="pill"/);
          expect(html).toMatch(/<html[^>]*\sdata-ground="sky"/);
          expect(html).toContain('<meta name="page-type" content="software">');
          expect(html).toContain('<meta name="site-kind" content="software">');
          expect(html).toContain("<title>Stigi: the feedback board for product teams</title>");
          expect(html).toContain("--p-bg: #ecebe7;");
          expect(html).toContain('--font-display: "Host Grotesk"');
          expect(html).toContain("family=Host+Grotesk");
          expect(html).toContain('href="/landing/assets/system.css"');
          expect(html).toContain('data-mark="ring"');
        });

        it("leads with the h1 and the one main action in nav, hero and close", () => {
          expect(html).toMatch(/<h1[^>]*>The feedback board for product teams<\/h1>/);
          const ctas = html.match(/<a\b[^>]*href="\/board"[^>]*>\s*Try Stigi\s*(<svg[\s\S]*?<\/svg>\s*)?<\/a>/g) ?? [];
          expect(ctas).toHaveLength(3);
          expect(html).toContain('class="hero hero--split"');
        });

        it("has every planned section in order", () => {
          const order = ["top", "how", "teach", "steps", "actions", "by-hand", "faq"].map((id) => html.indexOf(`id="${id}"`));
          expect(order.every((i) => i > 0)).toBe(true);
          expect([...order].sort((a, b) => a - b)).toEqual(order);
          expect(html).toContain('class="footer closing');
        });

        it("shows the product only as real screenshots of the running app", () => {
          const shots = imgs.filter((img) => img.includes('data-subject="screenshot"'));
          expect(shots).toHaveLength(4);
          for (const name of SHOTS) {
            expect(shots.some((img) => img.includes(`src="/landing/assets/shots/${name}"`))).toBe(true);
            const file = `public/landing/assets/shots/${name}`;
            expect(fs.existsSync(file), file).toBe(true);
            expect(fs.statSync(file).size, file).toBeGreaterThan(20_000);
          }
          for (const img of shots) expect(img).toContain('data-source="client"');
          // no drawn mock-ups of the app: no kit UI windows or fragments
          expect(html).not.toMatch(/class="ui[\s"]|data-ui=|data-ui-load=/);
        });

        it("is honest: no testimonials, logos, invented statistics or people", () => {
          expect(html).not.toMatch(/<blockquote|logo-row|customer-proof/i);
          // wording and figures are checked on the visible text (kit inline styles such as --ly-pos: 50% 58% are fine)
          expect(text).not.toMatch(/testimonial|trusted by|our customers|customers love|\b\d+(\.\d+)?\s?%/i);
          for (const img of imgs) {
            expect(img).toMatch(/\salt="[^"]+"/);
            expect(img).toMatch(/\sdata-source="[^"]+"/);
          }
          expect(imgs.filter((img) => img.includes('data-source="library-057"'))).toHaveLength(1);
          expect(imgs.filter((img) => /data-subject="(person|people|portrait|team|customer)"/.test(img))).toHaveLength(0);
        });

        it("credits the photograph and the fonts, and says the demo data is synthetic", () => {
          expect(html).toContain("Jan Kahánek");
          expect(html).toContain("CC0");
          expect(html).toContain("Wikimedia Commons");
          expect(html).toContain("SIL Open Font License");
          expect(text).toContain("200 synthetic sample comments for a fictional expenses app");
        });

        it("contains no violet", () => {
          expect(html.toLowerCase()).not.toMatch(/violet|lavender|#8b5cf6|#7c3aed|#a78bfa/);
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run scripts/lib/landing-content.test.mjs`
      Expected: FAIL — `expected '<!doctype html>…' to match /<html[^>]*\sdata-radius="soft"/` (the Task 60 page is the bare first version)

- [ ] **Step 3: Capture the four screenshots from the running app**
      Create `e2e-landing/capture-screenshots.e2e.ts`:
      ```ts
      import { mkdirSync } from "node:fs";

      import { expect, test, type Locator, type Page } from "@playwright/test";

      const OUT = "public/landing/assets/shots";
      const CHIP = "Sample data · pre-sorted starting layout";

      async function signUp(page: Page, baseURL: string): Promise<void> {
        const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const account = { email: `stigi-shots+${stamp}@example.com`, password: `Stigi-shots-${stamp}-Pw1!` };
        const headers = { origin: baseURL, "content-type": "application/json" };
        const register = await page.request.post(`${baseURL}/_agent-native/auth/register`, { data: account, headers });
        expect(register.status(), await register.text()).toBeLessThan(400);
        const login = await page.request.post(`${baseURL}/_agent-native/auth/login`, { data: account, headers });
        expect(login.status(), await login.text()).toBeLessThan(400);
      }

      /** Pointer drag that dnd-kit's PointerSensor (6 px activation) recognises. */
      async function drag(page: Page, source: Locator, target: Locator): Promise<void> {
        await source.scrollIntoViewIfNeeded();
        const from = await source.boundingBox();
        const to = await target.boundingBox();
        if (!from || !to) throw new Error("drag: source or target is not visible");
        const x = from.x + from.width / 2;
        const y = from.y + from.height / 2;
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + 12, y + 12, { steps: 4 });
        await page.mouse.move(to.x + to.width / 2, to.y + Math.min(to.height / 2, 60), { steps: 20 });
        await page.mouse.up();
      }

      async function shoot(page: Page, name: string): Promise<void> {
        await expect(page.getByText(CHIP)).toBeVisible();
        await page.mouse.move(1, 1);
        await page.waitForTimeout(600); // let the layout animation and hover states settle
        await page.screenshot({ path: `${OUT}/${name}`, type: "jpeg", quality: 82 });
      }

      test("capture real screenshots of the board with the labelled sample data", async ({ page, baseURL }) => {
        test.setTimeout(180_000);
        mkdirSync(OUT, { recursive: true });
        await page.setViewportSize({ width: 1600, height: 1000 });
        await page.addInitScript(() => {
          window.localStorage.setItem("stigi.autoTeach", "0");
        });
        await signUp(page, baseURL ?? "");
        await page.goto("/board");
        await page.getByRole("button", { name: "Load sample data (200 notes)" }).click();
        await expect(page.locator("[data-note-id]")).toHaveCount(200, { timeout: 60_000 });
        await shoot(page, "board-overview.jpg");

        await page.setViewportSize({ width: 1180, height: 1340 });
        await shoot(page, "board-hero.jpg");
        await page.setViewportSize({ width: 1600, height: 1000 });

        const note = (text: string) => page.locator("[data-note-id]", { hasText: text }).first();
        await drag(page, note("which plan am I even on?"), page.getByTestId("new-cluster-zone"));
        const untitled = page.locator('section[data-cluster-name="Untitled"]');
        await expect(untitled.locator("[data-note-id]")).toHaveCount(1);
        await drag(page, note("the billing page makes no sense"), untitled);
        await expect(untitled.locator("[data-note-id]")).toHaveCount(2);
        await shoot(page, "board-teach.jpg");

        await note("Android app logs me out every couple of days.").click();
        await note("Offline mode loses expenses I entered on the plane.").click();
        await expect(page.getByText("2 selected")).toBeVisible();
        await shoot(page, "board-selection.jpg");
      });
      ```
      Playwright starts the landing dev server on :8091 (its own database folder, normal sign-in page); never stop or reuse the :8080 server other tasks use.
      Run: `pnpm exec playwright test --config playwright.landing.config.ts e2e-landing/capture-screenshots.e2e.ts --project=local`
      Expected: `1 passed`, and `public/landing/assets/shots/` holds `board-hero.jpg`, `board-overview.jpg`, `board-teach.jpg`, `board-selection.jpg`. Look at all four: each shows the real board with the "Sample data" chip in the top bar. If the dev server fails to start with `Could not resolve './hoc'` (or `./hook`, `./config`, `./createRef`), the install is missing files: run `pnpm install --force` and retry once.

- [ ] **Step 4: Copy the kit assets and fetch the dealt photograph**
      ```bash
      K=docs/design/frontend-kit/assets
      D=public/landing/assets
      mkdir -p $D/ui $D/motion $D/layout $D/diagrams
      cp $K/system.css $K/system.js $D/
      cp $K/ui/cards.css $K/ui/ui.js $D/ui/
      cp $K/motion/motion.css $K/motion/motion.js $D/motion/
      cp $K/layout/layout.css $K/layout/layout.js $D/layout/
      cp $K/diagrams/diagram.css $K/diagrams/diagram.js $K/diagrams/mount.js $K/diagrams/presets.json $D/diagrams/
      ffmpeg -version | head -1
      node docs/design/frontend-kit/scripts/photos.mjs fetch d183 --out public/landing
      node docs/design/frontend-kit/scripts/icons.mjs fetch ui:user ui:layers ui:database ui:message-square ui:refresh-cw --out public/landing/assets/icons
      ls public/landing/assets/img public/landing/assets/icons
      ```
      Expected: an ffmpeg version line (the photo fetch needs ffmpeg for `.webp`; ffmpeg 9 is installed on this machine), then `credits.json  photo-d183-500.webp  photo-d183-960.webp  photo-d183.webp` and `icons-credits.json  ui-database.svg  ui-layers.svg  ui-message-square.svg  ui-refresh-cw.svg  ui-user.svg` (Lucide line icons, ISC licence; `diagram.js` reads them from `/landing/assets/icons/`). Run both fetches from the repo root (`icons.mjs` refuses an `--out` outside the working folder). If `photos.mjs fetch` reports a size left out or prints different files, use the `src`, `srcset`, `width` and `height` it printed (made root-relative) and list exactly the files it wrote. The copies are kit files: never edit them (`layout/layout.js` imports `../ui/ui.js`, which is why `ui/ui.js` is copied). Reference every asset root-relative (`/landing/assets/…`): the page is served at `/`, and a `<base>` tag would break the `#id` links.

- [ ] **Step 5: Build the page**
      Read, in full, `docs/design/frontend.md`, then `docs/design/frontend-kit/references/copy.md`, `system.md`, `layout-v4.md`, `sections.md`, `cards.md`, `diagrams.md`, `photos.md` (Credits), and in `sections-library.md` the recipes `split-text-left`, `app-frame`, `steps`, `faq`, `close-type`, `footer-statement`. Start from `docs/design/frontend-kit/assets/starter.html` and `docs/design/frontend-kit/assets/layout/hero-split.html` (copy only its `<section class="hero hero--split">`, never its nav, other sections or footer), then write `public/landing/index.html`:
      - `<html lang="en" data-type="software" data-page="stigi-landing" data-radius="soft" data-buttons="pill" data-ground="sky" data-motion>` and the two metas from the page plan; `<title>` and meta description verbatim.
      - `assets/icons/icon.css` and `assets/backgrounds/*` from the starter's head are not used on this page (no `data-icon` tags, no CSS grounds; the `sky` ground tokens live in `system.css`): leave them out.
      - Keep the FAQ disclosure sentence (`200 synthetic sample comments for a fictional expenses app`) on one source line, and keep the body's first-line comment to the kind and the deal only.
      - In `<head>`, in this order: the Google Fonts preconnects and the link `https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@400..700&family=JetBrains+Mono:wght@400..500&display=swap`; the stylesheets `/landing/assets/system.css`, `/landing/assets/ui/cards.css`, `/landing/assets/motion/motion.css`, `/landing/assets/layout/layout.css`, `/landing/assets/diagrams/diagram.css`, `/landing/landing.css`; then this `<style>` exactly as `start.mjs` printed it for the deal:
        ```css
        :root {
          --p-bg: #ecebe7; --p-surface: #e1dfd9; --p-ink: #38450f; --p-muted: #5a6537;
          --p-accent: #38450f; --p-accent-ink: #ecebe7; --p-action: #38450f; --p-action-ink: #ecebe7;
          --p-inv-bg: #38450f; --p-inv-surface: #435020; --p-inv-ink: #ecebe7; --p-inv-muted: #bbbfaf;
          --p-inv-accent: #ecebe7; --p-inv-accent-ink: #38450f; --p-inv-action: #ecebe7; --p-inv-action-ink: #38450f;
          --font-display: "Host Grotesk", system-ui, sans-serif;
          --font-text: "Host Grotesk", system-ui, sans-serif;
          --font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
          --display-weight: 500;
          --display-tracking: -0.035em;
          --display-tracking-xl: -0.04em;
        }
        ```
      - The body's first line is a comment recording plan lines 1–2 (kind and deal, as in this plan's header). Build `header.nav.nav--centre`, then `main` with the seven sections of the page plan in order (ids `top`, `how`, `teach`, `steps`, `actions`, `by-hand`, `faq`; `actions` on `.ground-inverse`), then `footer.footer.closing.footer--statement` holding the `close--type` row and the links row, each to its recipe with the system's classes. Write every word from this plan's Copy block verbatim; add no other claims.
      - The four screenshots (each `<img>` carries `data-source="client" data-subject="screenshot"`, its true `width`/`height`, the `alt` from the Copy block, `decoding="async"`; the hero eager with `fetchpriority="high"`, the rest `loading="lazy"`): `board-hero.jpg` (1180×1340) fills the hero's `.hero__media span-6 start-7` frame (radius `--r-lg`, `object-fit: cover`, anchored top-left with `--ly-pos: 0% 0%`) with the one `ly-float` card; `board-overview.jpg` (1600×1000) in section `how`, framed wide across the `.wrap` in place of the app-frame recipe's fragments (one window, radius `--r-lg`, a hairline border, cropped by its frame, never upscaled); `board-teach.jpg` (1600×1000) as the picture of `teach`; `board-selection.jpg` (1600×1000) as the picture of `steps`. Page CSS in `public/landing/landing.css` only frames and crops these images (`object-fit`, `object-position`, aspect ratios per breakpoint); never draw UI.
      - Section `actions`: the diagram card from the Copy block. Section `by-hand`: the photograph, using exactly the markup `photos.mjs fetch` printed but with root-relative paths: `<img src="/landing/assets/img/photo-d183.webp" srcset="/landing/assets/img/photo-d183-500.webp 500w, /landing/assets/img/photo-d183-960.webp 960w, /landing/assets/img/photo-d183.webp 1280w" sizes="(max-width: 639px) 188vw, (max-width: 1023px) 100vw, 50vw" width="1280" height="853" alt="Open blank notebook with a ribbon marker and a pencil lying across the pages on a dark wooden table" loading="lazy" decoding="async" data-source="library-057" data-subject="desk">`. No caption under any picture; the one credits line lives in the footer.
      - Before `</body>`: `<script type="module" src="/landing/assets/system.js"></script>`, `<script type="module" src="/landing/assets/motion/motion.js"></script>`, `<script type="module" src="/landing/assets/layout/layout.js"></script>`, `<script type="module" src="/landing/assets/diagrams/mount.js"></script>`.
      - At 390 the hero stacks text first, buttons full width, the nav becomes the kit's full-screen menu; every visual draws at 1440, 1024, 768 and 390 (`frontend.md` house rule 2).
      Then compile the module:
      Run: `node scripts/build-landing.mjs`
      Expected: `LANDING_MODULE_OK written`

- [ ] **Step 6: Run the content test and the freshness check (the gate)**
      Run: `pnpm vitest run scripts/lib/landing-content.test.mjs && node scripts/build-landing.mjs --check`
      Expected: PASS — `Tests  7 passed (7)` (the four screenshots exist and are the only product pictures; no testimonials, logos, statistics or people), then `LANDING_MODULE_OK`

- [ ] **Step 7: Commit (kernel-performed — no agent runs this)**
      Message: `feat: build the Stigi landing page from real board screenshots with the design skill`

---

### Task 62: Pass the skill's checkers on the served landing page

**Files:**
- Create: `scripts/check-landing.mjs`
- Modify: `public/landing/index.html`
- Modify: `public/landing/landing.css`
- Modify: `server/landing/landing-html.ts`

**Depends on:** Task 60, Task 61
**Effort:** high
**Provides:** `node scripts/check-landing.mjs -> LANDING_CHECKS_OK (consistency.mjs + check.mjs on the served /)`
**Requires:** `public/landing/index.html (skill-built landing: kind software, dealt hero split, 7 sections + close/footer, verbatim copy, honest pictures)`, `node scripts/with-dev-server.mjs "<command>"... (runs commands against a dev server on :8091)`, `node scripts/build-landing.mjs [--check] -> LANDING_MODULE_OK`

UI task: `docs/design/frontend.md` step 6 (check and look). The checkers run against the page **as the app serves it** (`http://localhost:8091/`, the landing's own dev server), so `/board` links and `/landing/assets/…` resolve. They need system Chrome (`C:/Program Files/Google/Chrome/Application/chrome.exe`, or set `CHROME_PATH`). Fix every FAIL in `public/landing/index.html` / `public/landing/landing.css` (never in the kit copies under `public/landing/assets/`), re-run `node scripts/build-landing.mjs` after every HTML edit, and keep the Copy block's words and the honesty rules intact while fixing. Two notes from the kit's checker source: `sample-label` FAILs more than two lines that tag figures as samples, and any line saying the page's "names/data/figures are … fictional/illustrative/examples" — the FAQ's one disclosure sentence (`200 synthetic sample comments for a fictional expenses app`) passes both rules; never delete it (the Rules require the sample label). A FAIL you judge false stays a FAIL for this gate: report BLOCKED with the finding instead of weakening the page.

- [ ] **Step 1: Write the checker runner**
      Create `scripts/check-landing.mjs`:
      ```js
      import { spawnSync } from "node:child_process";
      import os from "node:os";
      import path from "node:path";

      const KIT = "docs/design/frontend-kit";
      const URL_ = "http://localhost:8091/";
      const profile = (name) => path.join(os.tmpdir(), `stigi-taste-${name}`);
      const commands = [
        `node ${KIT}/scripts/consistency.mjs ${URL_} --page software --category "feedback board" --audience "product teams" --primary "Try Stigi" --widths 1440,1024,820,768,390 --rhythm-widths 1440,820,768,390 --profile "${profile("consistency")}"`,
        `node ${KIT}/assets/layout/check.mjs --url ${URL_} --profile "${profile("layout")}" --sizes 1440x900,1024x768,820x1180,768x1024,390x844`,
      ];
      const result = spawnSync("node", ["scripts/with-dev-server.mjs", ...commands], { stdio: "inherit" });
      if (result.status !== 0) {
        console.error("LANDING_CHECKS_FAIL");
        process.exit(result.status ?? 1);
      }
      console.log("LANDING_CHECKS_OK");
      ```

- [ ] **Step 2: Run the checkers and read every finding**
      Run: `node scripts/build-landing.mjs --check && node scripts/check-landing.mjs`
      Expected on the first run: FAIL rows to fix (the checkers print each finding with its element, a crop and a one-line fix).

- [ ] **Step 3: Fix every FAIL, rebuild, and re-run until clean (the gate)**
      After each round of fixes run `node scripts/build-landing.mjs`, then:
      Run: `node scripts/build-landing.mjs --check && node scripts/check-landing.mjs`
      Expected: `LANDING_MODULE_OK`, both checkers exit 0 (no FAIL rows), then `LANDING_CHECKS_OK`

- [ ] **Step 4: Commit (kernel-performed — no agent runs this)**
      Message: `fix: pass the design skill's consistency and layout checks on the landing page`

---

### Task 63: The dealt `iris-opens` moment on the dark band (cuttable)

**Files:**
- Modify: `public/landing/index.html`
- Modify: `server/landing/landing-html.ts`
- Create: `public/landing/assets/moments/moments.js`
- Create: `public/landing/assets/moments/lib.js`
- Create: `public/landing/assets/moments/iris-opens/moment.css`
- Create: `public/landing/assets/moments/iris-opens/moment.js`

**Depends on:** Task 60, Task 62
**Effort:** medium
**Provides:** `landing moment iris-opens on #actions (references/moments.md)`
**Requires:** `node scripts/check-landing.mjs -> LANDING_CHECKS_OK (consistency.mjs + check.mjs on the served /)`, `node scripts/build-landing.mjs [--check] -> LANDING_MODULE_OK`

UI task: `docs/design/frontend.md` (moments are tech-only, at most the dealt one; `references/moments.md`). `iris-opens` (meta: kind transition, fits section, trigger scroll, cost low, no WebGL, max 1 per page) needs a section on another ground than the one before it with its h2 first — `#actions` on `.ground-inverse` qualifies. Under reduced motion and on a phone the section simply stands on its own ground. First in the cut order: if time runs short, skip this task (see the plan header's cut procedure).

- [ ] **Step 1: Copy the moment runtime and the dealt moment**
      ```bash
      K=docs/design/frontend-kit/assets/moments
      D=public/landing/assets/moments
      mkdir -p $D/iris-opens
      cp $K/moments.js $K/lib.js $D/
      cp $K/iris-opens/moment.css $K/iris-opens/moment.js $D/iris-opens/
      ```

- [ ] **Step 2: Mount the moment**
      Following `docs/design/frontend-kit/references/moments.md` and `docs/design/frontend-kit/assets/moments/iris-opens/demo.html`, add `data-moment="iris-opens"` to the `#actions` section, and in `<head>` the modulepreload links `<link rel="modulepreload" href="/landing/assets/moments/moments.js">`, `<link rel="modulepreload" href="/landing/assets/moments/lib.js">`, `<link rel="modulepreload" href="/landing/assets/moments/iris-opens/moment.js">` plus the starter's one-line `mo-js`/`mo-safe` script exactly as `docs/design/frontend-kit/assets/starter.html` line 46 has it. `system.js` loads `moments/moments.js` itself when a `[data-moment]` exists. Then run `node scripts/build-landing.mjs`.

- [ ] **Step 3: Audit the moment and re-run the checkers (the gate)**
      Run: `node scripts/build-landing.mjs --check && node docs/design/frontend-kit/scripts/moments.mjs check public/landing/index.html --page software && node scripts/check-landing.mjs`
      Expected: `LANDING_MODULE_OK`, the moments audit reports no FAIL (one moment, the still rule kept, 0 of 4 WebGL contexts), then `LANDING_CHECKS_OK`

- [ ] **Step 4: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add the dealt iris-opens moment to the landing page`

---

### Task 64: Landing on production (HUMAN GATE)

**Files:**
- (none — redeploy and production verification only)

**Depends on:** Task 13, Task 60, Task 62
**Effort:** medium
**Model tier:** top
**Provides:** `landing verified on production: public / and /board behind sign-in`
**Requires:** `production probe disabled (STIGI_ENABLE_PROBE absent)`, `e2e-landing/landing-public.e2e.ts (2 tests)`, `node scripts/check-landing.mjs -> LANDING_CHECKS_OK (consistency.mjs + check.mjs on the served /)`

Human-gated (`gate_profile: deploy`); the only human gate in this plan. Part of M3's production verification: deploy Task 52 depends on this task, and nothing else does; the orchestrator keeps building while it waits. It ships whatever landing code is done (the optional Task 63 moment only if it already landed).

- [ ] **Step 1: Redeploy (user) — the deploy plan's redeploy recipe**
      ```bash
      read -rs DATABASE_URL && export DATABASE_URL
      pnpm migrate:production
      unset DATABASE_URL
      NITRO_PRESET=vercel AGENT_NATIVE_VERCEL_CRON_SCHEDULE="0 9 * * *" pnpm build
      node scripts/check-vercel-output.mjs
      pnpm exec vercel deploy --prebuilt --prod
      ```

- [ ] **Step 2: Verify the public landing and the sign-in wall on production (the gate)**
      Run: `STIGI_E2E_TARGET=deployed pnpm exec playwright test --config playwright.landing.config.ts e2e-landing/landing-public.e2e.ts --project=deployed`
      Expected: PASS — `2 passed` (a signed-out `GET /` is 200 with the landing h1 and the "Try Stigi" link; a signed-out `/board` shows the sign-in screen)

- [ ] **Step 3: Commit (kernel-performed — no agent runs this)**
      Message: `chore: landing verified on production (no file changes)`
