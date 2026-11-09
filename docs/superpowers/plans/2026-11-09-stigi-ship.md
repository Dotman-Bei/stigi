# Stigi Ship Implementation Plan

**Goal:** Replace the stub README with the judge-facing `R1-web-app v1` README and prove the whole app is green locally (all unit/component tests, typecheck, production build) before the M3 deploy.
**Architecture:** One ordinary README task (schema R1 from `references/readme-schemas.md`, no event overlay — the event mandates no README sections) with `TBD-post-build:` lines the Step-3 gate-concierge resolves, plus one verification-only task that runs the full local suite.
**Tech Stack:** Markdown, Windows PowerShell 5.1 (conformance check), Vitest `^4.1.5`, `agent-native typecheck`, `agent-native build`.
**Source spec:** docs/superpowers/specs/2026-11-09-stigi-design.md

**Rules for every task in the five Stigi plans:**
- Task numbers are **global** across the five plans (foundation 1–3, deploy 6–13 and 50–52, board 14–33, sort-report 34–42, ship 43–44). A `Depends on` may name a task in another plan.
- Run every command from the repo root in **Git Bash** (POSIX); the README gate calls `powershell -NoProfile -Command` from Git Bash. Never print, echo or commit a secret.
- Every task that touches sample data keeps the "sample" label (the README says the demo uses labeled sample data).
- Step "Commit" is performed by the orchestrator/kernel, never by the executor.

---

### Task 43: README (`R1-web-app v1`) and LICENSE

**Files:**
- Modify: `README.md`
- Create: `LICENSE`

**Depends on:** Task 36, Task 42, Task 62
**Effort:** medium
**Provides:** `README.md (R1-web-app v1, TBD-post-build lines for demo video, live URL, screenshot)`, `LICENSE (MIT)`
**Requires:** `e2e/sort-batch.spec.ts (live, TURN_BUDGET_MS=35000, retries 1)`, `e2e/report-export.spec.ts`

Schema `R1-web-app v1` (UI is the product; the agent is reached through the UI). Resolved heading list, in order: `# Stigi` · `## Demo` · `## What it does` · `## Quickstart` · `## Built at Agent-Native Hackathon (Builder.io)` · `## How it works` · `## Tech stack` · `## Run locally` · `## Roadmap` · `## License` (optional `## Contract addresses` omitted: no chain). Stamp line 1: `<!-- readme-schema: R1-web-app v1 -->`. TBD lines carried for the closing pass: `TBD-post-build:demo-video-url`, `TBD-post-build:live-app-url`, `TBD-post-build:screenshot`.

- [ ] **Step 1: Write the README (copy verbatim)**
      Replace the whole of `README.md` with:
      ````markdown
      <!-- readme-schema: R1-web-app v1 -->
      # Stigi

      A feedback board where an agent sorts customer comments into themes, you drag two notes to teach it, and it re-sorts the rest.

      ## Demo

      - Demo video (public Clips recording): TBD-post-build:demo-video-url
      - Live app (sign up with any email and password): TBD-post-build:live-app-url
      - Screenshot: TBD-post-build:screenshot

      The live app and the video use **sample data**: 200 synthetic comments for a fictional expenses app, labeled as
      sample in the app and loaded as a deliberately imperfect pre-sorted starting layout.

      ## What it does

      Product teams sit on hundreds of raw customer comments, and turning them into themes is hours of sticky-note
      work. One-shot AI summaries can't be corrected: fix one grouping by hand and the rest of the pile doesn't follow.
      Stigi makes the correction the instruction. Drag two notes into a new cluster and the agent names the theme, pulls
      every matching note in from across the board, and shows a one-line reason on each note it moved. "Sort with agent"
      files the unsorted pile in small batches, and the agent writes a ranked insight report you edit and export as
      Markdown.

      ## Quickstart

      ```bash
      pnpm install
      cp .env.example .env    # then add your OpenRouter key to .env as OPENROUTER_API_KEY (never commit it)
      pnpm dev                # http://localhost:8080, choose "Continue as local dev"
      ```

      Open **Feedback board**, click **Load sample data (200 notes)**, drag "which plan am I even on?" onto **New
      cluster**, then drag "the billing page makes no sense" onto the new cluster. The agent names it and the matching
      notes glide in from the other clusters.

      ## Built at Agent-Native Hackathon (Builder.io)

      - Event: the Agent-Native Hackathon by Builder.io (final submission deadline 2026-11-09 23:59 PT).
      - Recognition categories aimed at: Best Overall App, Best Use of Agent-Native, Best Productivity App (the event has
        no tracks; one weighted rubric ranks every entry).
      - Team: a solo builder (GitHub `Dotman-Bei`) working with Claude Code.
      - Built during the event (2026-11-09): every Stigi action, the board UI, the agent instructions and skills, the
        database schema, the per-account daily agent-turn cap, the Vercel deployment setup and the test suites.
      - Pre-existing work built on: the Agent-Native `chat` template (`@agent-native/core` 0.226.0) and its
        `@agent-native/toolkit` components (app shell, agent sidebar), plus design tokens and motion rules from the
        `design-taste-frontend` kit.

      ## How it works

      Stigi is an Agent-Native app: the board UI and the agent share one set of `defineAction()` actions, one Postgres
      database and one app-state.

      - **One action layer.** `import-notes`, `list-notes`, `create-cluster`, `rename-cluster`, `move-notes`,
        `merge-clusters`, `delete-cluster`, `get-board-digest`, `save-report` and `view-screen` are the only way the board
        changes. A drag in the UI calls `move-notes`; the agent calls the same `move-notes` as a tool. When the agent
        moves a note into a cluster it must give a one-line reason, or the action refuses.
      - **Teach by dragging.** When a cluster you made reaches two notes, the UI hands the request to the agent with the
        cluster id and the seed notes as hidden context. The agent follows its `teach-cluster` skill: name the theme,
        list the notes outside the cluster, and move the clear matches in one call.
      - **Shared app-state.** Your note selection is written to the `selection` app-state key and read by the agent's
        `view-screen`; the agent opens the report pane with a `navigate` command.
      - **Live board.** Each agent tool call refreshes the board's queries, and the board also polls every 2 seconds
        while the agent works, so moved notes glide into place even on serverless hosting.
      - **Short agent turns.** Every agent turn is one small batch (teach: up to 20 moves; sort: up to 25 notes), so it
        finishes inside the framework's 40-second hosted turn budget. Vercel functions run with `maxDuration: 60`.
      - **Safe public demo.** Sign-in is required, each account sees only its own board, the OpenRouter key stays on the
        server, and each account gets 40 agent turns per day.

      ## Tech stack

      - Agent-Native framework `@agent-native/core` 0.226.0 (React 19, React Router 8, Nitro 3, Drizzle ORM)
      - Postgres: PGlite locally, Neon in production
      - Agent: OpenRouter through the framework's `ai-sdk:openrouter` engine, model `anthropic/claude-sonnet-5.5`
      - UI: `@dnd-kit/core` drag-and-drop, `motion` layout animation, Host Grotesk and JetBrains Mono
      - Tests: Vitest (actions on in-memory PGlite, components with Testing Library) and Playwright end-to-end
      - Hosting: Vercel (`NITRO_PRESET=vercel`)

      ## Run locally

      ```bash
      pnpm install
      pnpm dev           # http://localhost:8080
      pnpm vitest run    # unit and component tests (no API key needed)
      pnpm e2e           # Playwright against the local dev server (the live specs need OPENROUTER_API_KEY)
      ```

      | Variable | Purpose |
      |---|---|
      | `OPENROUTER_API_KEY` | OpenRouter key for the agent (secret: `.env` only, never committed) |
      | `AGENT_ENGINE` | `ai-sdk:openrouter` |
      | `AGENT_MODEL` | `anthropic/claude-sonnet-5.5` (fallback: `anthropic/claude-haiku-5.5`) |
      | `AGENT_ENGINE_PREFER_BYO_KEY` | `1`: use your own key rather than a managed gateway |
      | `STIGI_DAILY_AGENT_TURNS` | Agent turns per account per day (default 40) |
      | `DATABASE_URL` | Production only: Neon pooled connection string (leave unset locally to use PGlite) |
      | `BETTER_AUTH_SECRET` | Production only: stable session-signing secret |
      | `AUTH_REQUIRE_EMAIL_VERIFICATION` | Production only: `0`, so password sign-up works without an email provider |

      ## Roadmap

      - Undo the agent's last batch.
      - Drag several selected notes at once.
      - Pick the comment column when a CSV has no recognised header.
      - Known limit: corrections steer the current board only; Stigi does not learn across sessions.

      ## License

      MIT — see [LICENSE](LICENSE).
      ````

- [ ] **Step 2: Add the license**
      Create `LICENSE`:
      ```text
      MIT License

      Copyright (c) 2026 Dotman-Bei

      Permission is hereby granted, free of charge, to any person obtaining a copy
      of this software and associated documentation files (the "Software"), to deal
      in the Software without restriction, including without limitation the rights
      to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
      copies of the Software, and to permit persons to whom the Software is
      furnished to do so, subject to the following conditions:

      The above copyright notice and this permission notice shall be included in all
      copies or substantial portions of the Software.

      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
      IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
      FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
      AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
      LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
      OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
      SOFTWARE.
      ```

- [ ] **Step 3: Run the README conformance check (the gate)**
      Run: `powershell -NoProfile -Command '$want = @("# Stigi","## Demo","## What it does","## Quickstart","## Built at Agent-Native Hackathon (Builder.io)","## How it works","## Tech stack","## Run locally","## Roadmap","## License"); $stamp = "<!-- readme-schema: R1-web-app v1 -->"; $fence = [string]([char]96) * 3; $lines = Get-Content README.md -Encoding UTF8; $inFence = $false; $got = foreach ($l in $lines) { if ($l.StartsWith($fence)) { $inFence = -not $inFence } elseif (-not $inFence -and $l -cmatch "^#{1,2} ") { $l } }; $ok = ($got.Count -eq $want.Count); if ($ok) { for ($i = 0; $i -lt $want.Count; $i++) { if ($got[$i] -cne $want[$i]) { $ok = $false } } }; if ($ok -and ($lines[0] -ceq $stamp)) { "PASS" } else { "FAIL" }'`
      Expected: `PASS`

- [ ] **Step 4: Commit (kernel-performed — no agent runs this)**
      Message: `docs: add the R1-web-app README and MIT license`

---

### Task 44: Final local verification (verification only)

**Files:**
- (none — verification only)

**Depends on:** Task 7, Task 8, Task 33, Task 36, Task 38, Task 41, Task 42, Task 43, Task 62
**Effort:** low
**Provides:** `final local verification: vitest + typecheck + build green`
**Requires:** `README.md (R1-web-app v1, TBD-post-build lines for demo video, live URL, screenshot)`, `node scripts/check-vercel-output.mjs -> VERCEL_OUTPUT_OK`

This task changes no files (`allow_empty`). If any step fails, report BLOCKED with the failing test file or type error; do not edit code here.

- [ ] **Step 1: Full unit/component suite, typecheck and production build (the gate)**
      Run: `pnpm vitest run && pnpm typecheck && pnpm build`
      Expected: Vitest reports every test file passed (no failures), typecheck exits 0, and the build ends with `Build complete.`

- [ ] **Step 2: Commit (kernel-performed — no agent runs this)**
      Message: `chore: final local verification green (no file changes)`
