# Stigi — Design Spec

> Stigi (from *stigmergy*: coordination through marks on a shared medium) is a feedback board where an
> agent sorts hundreds of customer comments into themes, you drag a few notes to correct it, and it
> re-sorts the rest to match, then writes the insight report. Agent and UI share the same actions, data
> and app-state.

| Field | Value |
|---|---|
| Spec date | 2026-11-09 (architect, Step 1, `claude-opus-5-5`, effort xhigh) |
| Source brief | `docs/idea-forge/2026-11-08-sortboard-brief.md` (working title "Sortboard" = **Stigi**) |
| Resource pack | `docs/resources/2026-11-08-agent-native-hackathon/` |
| Tollgate | `docs/tollgate/2026-11-08-tollgate.md` |
| UI doctrine | `docs/design/frontend.md` + kit `docs/design/frontend-kit/` |
| Project repo | `Dotman-Bei/stigi` (private until the Step-3 consent gate) |

## 0. Header — constraints (verbatim from the kickoff and the confirmed dialogue)

- **Target:** web app on the Agent-Native framework, `@agent-native/core` **pinned `0.226.0`** (npm
  `latest`, published 2026-11-06 19:07 UTC; the GitHub "v0.1.293" tag is the desktop app, not the npm
  package). Scaffold: `npx --yes @agent-native/core@0.226.0 create stigi --standalone --template chat`.
- **Language/runtime:** TypeScript strict + React (React Router 8.1.0, Nitro 3, Drizzle 0.45) on Node.js
  ≥ 22.22 (machine: v22.23.4), pnpm 10.x (template pins `pnpm@10.29.1` via corepack). PGlite locally
  (`DATABASE_URL` unset), Postgres (Neon) in production. No chain/Web3.
- **Agent-Native rule:** agent and UI genuinely share `defineAction()` actions, data and app-state
  (`view-screen`, `selection`, `navigate`). No inline LLM calls — all AI goes through the agent.
- **LLM path (tollgate C3):** OpenRouter. Engine `AGENT_ENGINE=ai-sdk:openrouter`, model
  `AGENT_MODEL=anthropic/claude-sonnet-5.5` (documented one-env-var fallback:
  `anthropic/claude-haiku-5.5`), `AGENT_ENGINE_PREFER_BYO_KEY=1`, key `OPENROUTER_API_KEY` (name only;
  value lives only in the git-ignored `.env` and in Vercel's production env).
- **Hard deadline:** Mon 2026-11-09 23:59 PT = 2026-11-10 07:59 UTC = Tue 2026-11-10 08:59 WAT. Build
  budget ≤ ~14 h of orchestrator time; internal stop: submitted by 2026-11-10 03:00 WAT.
- **Team:** solo + AI. Built in Claude Code by the orchestrator (one fresh subagent per task).
- **Deploy:** live deploy **required, on the critical path**: Vercel (`NITRO_PRESET=vercel`) + Neon.
- **Demo:** a public Clips recording of the real app, recorded by the builder (out of build scope).
  Sample data is labeled as sample everywhere.
- **UI:** all UI follows `docs/design/frontend.md`. Every frontend task's code applies its tokens, type,
  layout and components, and its task block cites the file.

## 1. Problem and outcome

Product teams sit on hundreds of raw customer comments. Turning them into themes is hours of manual
sticky-note work, and one-shot AI summaries cannot be corrected: a hand correction does not carry to the
rest of the pile. Stigi makes the correction the instruction. The user drags two notes together; the agent
names the theme and pulls every matching note in from across the board, each with a one-line reason; the
agent then writes a ranked insight report the user edits and exports as Markdown.

**The money shot (must land on the deployed app):** on a board of ~200 sample comments the user drags
"which plan am I even on?" and "the billing page makes no sense" into the New-cluster zone. The agent
names the cluster (e.g. **Plan & billing confusion**) and ~12 more notes glide in from other clusters,
each showing a one-line reason. No prompt is typed.

## 2. Scope

**In scope:** CSV upload/paste import (≤ 500 notes) and a bundled 200-note sample; a board with an
Unsorted tray, cluster columns and a New-cluster drop zone; drag-and-drop moves; agent sorting in batches;
teach-by-dragging (auto at 2 seeds + "More like these"); rename/merge/delete clusters; an editable
insight report with Markdown export; per-user boards behind sign-in; a per-user daily agent-turn cap; a
live Vercel + Neon deployment with milestone redeploys; unit, component and Playwright end-to-end tests.

**Out of scope:** live connectors to feedback sources; embeddings, vector search, fine-tuning, sentiment
models, any Python/ML service; multi-user real-time collaboration, sharing, teams/orgs; charts,
dashboards, trends; inline LLM calls; persistent cross-session learning claims; production hardening
beyond §11 (no global cap, no rate limiting beyond the per-user daily cap, no SSO, no billing); anything
on-chain; the Clips recording; the repo-public flip (Step-3 consent gate).

## 3. Design decisions (dialogue record)

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Pin which framework version? | `@agent-native/core@0.226.0` (npm latest; v0.1.293 is the desktop app) | user approved fix 1 |
| D2 | How is OpenRouter selected? | `AGENT_ENGINE=ai-sdk:openrouter` + `AGENT_MODEL` env (verified in core 0.226.0 `dist/agent/engine/builtin.js`, `app-config/agent.js`); `@openrouter/ai-sdk-provider ^2.9.1` already in the chat template | user approved fix 2 |
| D3 | Model? | `anthropic/claude-sonnet-5.5` (tools + tool_choice verified on OpenRouter's model list 2026-11-09; ~$0.15 per full 200-note sort); fallback `anthropic/claude-haiku-5.5` | user approved fix 3 |
| D4 | App DB plumbing | Chat template has none; add `server/db/{schema,migrations,index}.ts` + `server/plugins/db.ts` (`runMigrations`) | user approved fix 4 |
| D5 | Visual direction | `start.mjs` deal: palette **olive-on-bone**, type **host** (Host Grotesk + JetBrains Mono), radius soft | user approved fix 6 |
| D6 | Deploy scope | **C — live deploy required, on the critical path**; walking skeleton is plan #2; tripwire at build hour 5; Vercel + Neon; all signup/secret/deploy tasks `human_gate: true` | user, Q1 |
| D7 | Teach trigger | **Auto at 2 seeds** (once per user-made untitled cluster) + manual "More like these" | user, Q2 |
| D8 | Deploy gates | Deploy tasks gate only themselves and Step 3; M1/M2 redeploys are never on the dependency path of build tasks; only M3 blocks submission; the orchestrator keeps building while a deploy gate waits | user, addition 1 |
| D9 | Function duration | `nitro.config.ts` sets `vercel.functions.maxDuration: 60` and explicit `functionRules` for the agent-chat routes (verified: Vercel output carries `"maxDuration": 60` on `_agent-native/agent-chat*.func`); the skeleton probes the deployed URL for the real limit | user, addition 2 |
| D10 | First-run | Empty board shows one obvious action "Load sample data (200 notes)" + one-line explanation, labeled sample; fresh sign-up reaches the money shot in < 1 minute without a CSV | user, addition 3 |
| D11 | Cap message | Friendly, explicit ("demo credits for today are used"); UI never fails silently; **no global cap** | user, addition 4 |
| D12 | Cut order if behind | stretch → landing moments/scenes → merge/delete polish → CSV edge cases. Never cut: money shot, deploy skeleton, report, tests, or the landing hero + CTA once built (amended 2026-11-09 with the landing scope addition) | user |
| D13 | Live-sync mechanism | No Hosted Realtime Sync Gateway; same-tab chat-run tool-completion invalidation + explicit 2 s polling of `get-board` while the agent runs | architect, approved (E) |
| D14 | Live-key gates | Playwright e2e (framework `agent-native eval` CLI requires a production adapter with a read-only action surface, so it cannot exercise writes) | architect, approved (I) |
| D15 | Sample layout | **Sample board loads pre-sorted**: 150 notes in 6 deliberately imperfect starting clusters (`created_by = 'sample'`, notes `moved_by NULL`, no reason) + 50 unsorted; 14 plan/billing notes scattered across the wrong clusters and Unsorted (plus the 2 seeds), so the teach pulls from across the board with no prior agent sort; chip "Sample data · pre-sorted starting layout"; every sample artifact stays labeled sample | user, spec review change 1 |
| D16 | Probe exposure | `/api/duration-probe` returns 404 in production unless `STIGI_ENABLE_PROBE=1`; the skeleton sets the flag for the probe check, then removes it and redeploys; `check-vercel-env.mjs` asserts it is absent afterwards | user, spec review change 2 |
| D18 | Landing page (scope addition, mid-build) | An **additive sixth plan** (`landing:60–64`): a public marketing page at `/` built with the full design-skill workflow, `/board` still behind sign-in. The 45 existing tasks keep their id, files, gate and provides; only `ship:43`, `ship:44` (+`landing:62`) and `deploy:52` (+`landing:64`) gain a `depends_on`. Entry deps `foundation:3`, `board:26`, `deploy:9` (Playwright, done in build hour 1); `landing:61` also depends on `board:31` (real screenshots). `landing:63` (the moment) is optional: nothing depends on it. `landing:64` (deps `deploy:13`, `landing:62`) is the plan's only human gate and blocks only `deploy:52` | user, scope addition 2026-11-09 |
| D21 | Landing pictures | Real screenshots of the running board (sample data loaded, "Sample data" chip visible) captured by `e2e-landing/capture-screenshots.e2e.ts` with auto-teach off (no key); no mock-ups, no drawn stand-ins, no kit UI fragments; gate: the screenshots exist and the content test finds no testimonials, logos, statistics or people | user, landing review 2026-11-09 |
| D19 | Landing honesty | Product-UI-led: real screenshots of the running app (D21), one library detail photograph with its credit; no testimonials, customer logos, invented statistics or photographs of people; every number on the page a true product fact | user |
| D20 | Landing deal | Run with the kit's scripts: kind software; hero `split`; nav `nav-centre`; footer `footer-statement`; close `close-type`; rhythm `dark-band`; buttons `pill`; mark `ring`; lit ground `sky`; no CSS ground; no shader effect; moment `iris-opens` (one); photograph `d183` (CC0). Palette/type/radius = the board's deal (§10) | architect via `deal.mjs`, `start.mjs`, `moments.mjs`, `photos.mjs` |
| D17 | Timing-gate flake rule | A timing gate retries once; if the model misses 35 s twice, the documented action is `AGENT_MODEL=anthropic/claude-haiku-5.5` via env (local `.env` and Vercel), never a flow rewrite | user, spec review change 3 |

## 4. Architecture

One Agent-Native app scaffolded from the chat template and **moved to the repo root** (beside `docs/`),
so `pnpm install && pnpm dev` works from the top. The template's `README.md` stub, `CLAUDE.md` symlink
and `.git` are not copied. The template's coding-agent docs (`DEVELOPING.md`, `DESIGN.md`) stay.

```
AGENTS.md                         # in-app agent: Stigi domain section (always loaded)
.agents/skills/sort-feedback/SKILL.md
.agents/skills/teach-cluster/SKILL.md
.agents/skills/write-report/SKILL.md
actions/*.ts                      # one defineAction per file (+ colocated *.test.ts)
app/routes/board.tsx              # board page (+ <Outlet/> for the report pane)
app/routes/board.report.tsx       # report pane route (/board/report)
app/components/board/*.tsx        # board UI components
app/lib/board/*.ts                # pure UI logic (auto-teach rule, agent-move diff, handoffs, drop targets, sort loop)
app/styles/stigi-tokens.css       # frontend.md tokens scoped to .stigi
app/styles/board.css              # board component styles (tokens only)
server/db/schema.ts | migrations.ts | index.ts | test-db.ts
server/plugins/db.ts              # runMigrations(STIGI_MIGRATIONS)
server/lib/*.ts                   # owner, caller, csv, board-store, agent-usage, duration-probe
server/routes/api/duration-probe.get.ts
shared/board-types.ts             # types shared by actions and UI
shared/sample-feedback.ts         # 200 labeled synthetic comments
e2e/**                            # Playwright specs + helpers
playwright.config.ts
nitro.config.ts                   # Vercel function maxDuration
scripts/check-vercel-output.mjs   # build-output gate (maxDuration, cron, no key in client assets)
scripts/check-vercel-env.mjs      # production env-name gate
.env.example                      # names + non-secret settings only
```

**Template edit points (from the template's own `edit-points-chat.md`):** add `server/db/*` +
`server/plugins/db.ts`; add actions; add `app/routes/board*.tsx`; add a static Board link in
`app/components/layout/Sidebar.tsx` before `<ChatThreadsSection />`; extend
`app/hooks/use-navigation-state.ts` with the `board`/`report` views; set the agent system prompt +
`INITIAL_TOOL_NAMES` + `prepareRequest` in `server/plugins/agent-chat.ts`; set
`homePath: "/board"` in `server/plugins/agent-native-email-branding.ts`; add a Stigi section to
`AGENTS.md`. `Layout.tsx`, `root.tsx`, `home.tsx`, `chat.$threadId.tsx` are not restyled. Every non-chat
route is wrapped in the template's `AgentInspector` (the `AgentSidebar` on the right), so `/board` gets
the agent chat beside it with no layout work.

**Pinned additions:** `@dnd-kit/core@6.3.1` (same library as the framework's tasks template),
`motion@14.10.1` (layout animation), dev: `@playwright/test@1.65.0`, `@testing-library/react@16.3.3`.
Everything else comes from the scaffold (`zod ^4.4.3`, `drizzle-orm ^0.45.3`, `sonner`, `vitest ^4.1.5`,
`happy-dom 20.12.0`, `@tabler/icons-react`).

## 5. Data model

All tables are prefixed `stigi_`, owned by the signed-in user (`owner_email` = `ctx.userEmail`), one board
per user. Times are UTC ISO-8601 text. Ids are `crypto.randomUUID()`. Migrations are additive entries in
`server/db/migrations.ts`, applied by `server/plugins/db.ts` (local/dev startup) and by
`pnpm migrate:production` (release step). The plans apply the DDL below as six single-statement entries (v1–v6: each table and each index separately) because the Neon serverless driver rejects multi-statement strings; the version labels in the SQL comments below are descriptive.

```sql
-- v1 create_stigi_clusters
CREATE TABLE IF NOT EXISTS stigi_clusters (
  id TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  name TEXT,
  created_by TEXT NOT NULL CHECK (created_by IN ('user','agent','sample')),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS stigi_clusters_owner_idx ON stigi_clusters (owner_email);
-- v2 create_stigi_notes
CREATE TABLE IF NOT EXISTS stigi_notes (
  id TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  body TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('sample','import')),
  cluster_id TEXT,
  reason TEXT,
  moved_by TEXT CHECK (moved_by IN ('user','agent')),
  moved_at TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS stigi_notes_owner_cluster_idx ON stigi_notes (owner_email, cluster_id);
-- v3 create_stigi_reports
CREATE TABLE IF NOT EXISTS stigi_reports (
  owner_email TEXT PRIMARY KEY,
  markdown TEXT NOT NULL,
  updated_by TEXT NOT NULL CHECK (updated_by IN ('user','agent')),
  updated_at TEXT NOT NULL
);
-- v4 create_stigi_agent_turns
CREATE TABLE IF NOT EXISTS stigi_agent_turns (
  owner_email TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (owner_email, day)
);
```

`cluster_id IS NULL` means unsorted; `name IS NULL` means untitled. `moved_by = 'agent'` with a non-null
`reason` is what the UI renders as the agent's reason chip. A user move sets `moved_by = 'user'` and
clears `reason`.

**Shared types** (`shared/board-types.ts`):

```ts
export type Actor = "user" | "agent";
export type ClusterOrigin = "user" | "agent" | "sample";
export type NoteSource = "sample" | "import";
export interface BoardNote { id: string; body: string; source: NoteSource; clusterId: string | null; reason: string | null; movedBy: Actor | null; movedAt: string | null; position: number }
export interface BoardCluster { id: string; name: string | null; createdBy: ClusterOrigin; position: number; notes: BoardNote[] }
export interface BoardSnapshot { clusters: BoardCluster[]; unsorted: BoardNote[]; totalNotes: number; sampleNotes: number }
export interface AgentUsage { used: number; limit: number; remaining: number; resetsAt: string }
```

## 6. Action layer (one implementation; UI, agent, CLI, HTTP all call it)

Every action: zod schema, `requireOwner(ctx)` (fails 401 "Sign in to use Stigi."), owner-scoped queries,
`fail(message, { errorCode, statusCode })` for errors (never `{ error }` returns), result carries `id` and a
one-line `message`. `actorFromCtx(ctx)` = `"agent"` when `ctx.caller === "tool"`, else `"user"`.

| Action | Input | Behavior | Flags |
|---|---|---|---|
| `import-notes` | `{ csv?: string (≤2,000,000 chars), sample?: boolean }` — exactly one | Sample (D15): creates the 6 `SAMPLE_START_CLUSTERS` (`created_by:'sample'`) and inserts the 200 `SAMPLE_FEEDBACK` bodies with `source:'sample'` into their starting cluster (150) or Unsorted (50), `moved_by`/`reason` null; 409 `sample_already_loaded` if any sample note exists. CSV: `parseFeedbackCsv` → bodies, `source:'import'`, all unsorted. 400 `no_comments` if none; 400 `too_many_notes` if board total would exceed 500. Positions continue the max per column. | POST |
| `get-board` | `{}` | Returns `BoardSnapshot` (clusters by position, notes by position) | GET, readOnly |
| `list-notes` | `{ scope: 'unsorted'\|'all'\|'outside-cluster', clusterId?: string, limit: 1..250 = 60, offset ≥ 0 = 0 }` | Compact rows `{ id, text (≤200 chars), cluster: name \| 'Untitled' \| null }`, `total`, `nextOffset` (null at end). `outside-cluster` requires `clusterId` | GET, readOnly |
| `create-cluster` | `{ name?: string (1..60), noteIds?: string[] (≤50) }` | Creates cluster (`created_by` = actor) at the front (position = min − 1, newest first, so a new cluster is always visible at the top of the grid); moves `noteIds` in (user only). When actor is agent and `noteIds` is non-empty → 400 `agent_move_requires_reason` | POST |
| `rename-cluster` | `{ clusterId, name (1..60) }` | Renames; 404 `cluster_not_found` | POST |
| `move-notes` | `{ moves: [{ noteId, clusterId: string\|null, reason?: string (≤140) }] (1..50) }` | Validates every note + target cluster is owned (404s). Agent moves into a cluster require a non-empty reason → 400 `reason_required`. Sets `cluster_id`, `reason` (agent: given; user: null), `moved_by`, `moved_at`, `position` (end of target). | POST |
| `merge-clusters` | `{ sourceClusterId, targetClusterId }` (different) | Moves all source notes to target (`moved_by` actor; agent reason `Merged into "<target name>"`), deletes source | POST |
| `delete-cluster` | `{ clusterId }` | Its notes → unsorted (`moved_by` actor, reason null); deletes the cluster | POST |
| `get-board-digest` | `{}` | `{ totalNotes, unsortedCount, sampleNotes, themes: [{ clusterId, name, noteCount, share (integer %), quotes: string[] (≤3, first by position, ≤200 chars) }] }` sorted by `noteCount` desc; untitled clusters named "Untitled" | GET, readOnly |
| `get-report` | `{}` | `{ markdown, updatedBy, updatedAt }` (empty string + nulls when none) | GET, readOnly |
| `save-report` | `{ markdown (≤50,000) }` | Upsert; `updated_by` = actor | POST |
| `get-agent-usage` | `{}` | `AgentUsage` for today (UTC) | GET, readOnly |
| `reset-board` | `{}` | Deletes the owner's notes, clusters and report | POST, `agentTool: false` |
| `view-screen` (template, extended) | `{}` | `{ navigation, selection, board: { clusters: [{ id, name, noteCount, createdBy }], unsortedCount, totalNotes }, selectedNotes: [{ id, text, cluster }] (≤20), selectedCluster: { id, name, notes: [{ id, text }] (≤20) } \| null }` | `http:false`, readOnly |
| `navigate` (template) | unchanged | Agent → UI one-shot | `http:false` |

**CSV rules (`parseFeedbackCsv`):** RFC-4180 quoting (double quotes, escaped `""`, quoted newlines), `\r\n`
or `\n`. If the first row contains a header cell named (case-insensitive, trimmed) `comment`, `feedback`,
`text`, `body`, `note` or `message`, that column is the body and the header row is skipped; otherwise
column 0 of every row is the body. Bodies are trimmed, empty ones dropped, each truncated to 1,000 chars.

## 7. App-state, agent instructions and the three agent flows

**App-state keys.** `navigation` (UI-owned, written by `useNavigationState` on every route change):
`{ view: 'board' | 'report', path }` (`/board` → `board`, `/board/report` → `report`). `selection` (UI,
`setClientAppState` from `@agent-native/core/client/hooks`): `{ kind: 'stigi.board', noteIds: string[],
clusterId: string | null, capturedAt }`, cleared (null) when empty. `navigate` (agent-only):
`{ view: 'report' }` opens `/board/report`; `{ view: 'board' }` opens `/board`.

**Handoffs** (UI → agent, `useAgentChatGenerating()` send with `submit: true, openSidebar: true`; hidden
`context` carries ids so the agent needs no guessing):

| Flow | Visible message | Hidden context |
|---|---|---|
| Teach | `Teach: name this new cluster and pull in every note that belongs with it.` | `Stigi teach request. clusterId=<id>. Seed notes: [<id>] "<text>"; … Follow the teach-cluster skill.` |
| Sort | `Sort the next batch of unsorted notes (up to 25).` | `Stigi sort request. Follow the sort-feedback skill. Process ONE batch of at most 25 unsorted notes, then stop.` |
| Report | `Write the insight report from the current board.` | `Stigi report request. Follow the write-report skill.` |

**Auto-teach rule (D7).** After every board refetch, `findAutoTeachCluster(snapshot, firedIds)` returns
the first cluster with `createdBy === 'user'`, `name === null`, `notes.length >= 2`, not in `firedIds`.
If one is found, auto-teach is on, no agent run is active and the usage check passes, the UI adds it to
`firedIds` and sends the Teach handoff (seeds = its notes, ≤ 5). The agent's rename makes `name`
non-null, so it never fires twice. Auto-teach is a top-bar switch (default on, remembered in
`localStorage`), which the no-key e2e turns off. **More like these** (cluster header menu, or the
selection bar with ≥ 2 selected notes) sends the same handoff on demand; with a multi-note selection it
first calls `create-cluster { noteIds }`, which then auto-teaches.

**Agent instructions.** `AGENTS.md` (always loaded) gains a Stigi section: what the board is; invariants
(every agent move carries a one-line reason (aim ≤ 80 chars); never more than 50 moves per call; one batch per sort turn (≤ 25 notes);
call `view-screen` before acting on what the user sees; never invent notes; sample data is synthetic);
the action list. Skills (loaded on demand):

- `sort-feedback`: `view-screen` (cluster ids) + `list-notes {scope:'unsorted', limit:25}` → reuse existing clusters where they fit,
  otherwise `create-cluster {name}` (≤ 8 themes on the board, 2–4 word names) → one `move-notes` call
  with a reason per note → reply one line: "Sorted N notes; M unsorted remain." Stop.
- `teach-cluster`: read the seeds from the context (or `view-screen` → `selectedCluster`) → infer the
  shared theme → `rename-cluster` (2–4 words) → `list-notes {scope:'outside-cluster', clusterId, limit:250}`
  → pick notes that clearly share the theme (precision over recall, ≤ 20) → **one** `move-notes` call,
  each reason naming the shared trait (≤ 140 chars) → reply one line. Stop.
- `write-report`: `get-board-digest` → `save-report` with the fixed template below → `navigate
  {view:'report'}` → reply one line.

Report template (the skill pastes it): `# Customer feedback insights — <YYYY-MM-DD>`, a source line
(`_<N> comments; sample data_` when `sampleNotes > 0`), `## Top themes` with one numbered entry per theme
(`**<name>** — <count> comments (<share>%)`, 2–3 `>` quotes, `Suggested next step: <one sentence>`), and
`## Not yet sorted` with the unsorted count.

**System prompt** (`server/plugins/agent-chat.ts`, keeps `appId`): first sentence "You are Stigi's
sorting agent: you organize customer feedback notes on the user's board into themes using the board
actions, and every move you make carries a one-line reason." `INITIAL_TOOL_NAMES`: `view-screen`,
`navigate`, `list-notes`, `create-cluster`, `rename-cluster`, `move-notes`, `merge-clusters`,
`get-board-digest`, `save-report`, `get-report`.

## 8. Agent-turn budget on Vercel (requirements 5, 6; D9)

Verified in core 0.226.0 (`dist/agent/run-manager.js`, `durable-background.js`, `durable-resume.mdx`):
a hosted foreground turn chunk has a **40 s soft timeout** (ceiling, not raisable); on timeout the chat
**auto-continues client-side at most 3 times**; durable background runs (15 min) are **Netlify-only**;
each tool call has a 60 s hard limit. Vercel plan duration limits are not in the framework source.

- **Function duration.** `nitro.config.ts`: `vercel.functions.maxDuration = 60` and `functionRules` for
  `/_agent-native/agent-chat`, `/_agent-native/agent-chat/**`, `/_agent-native/agent-chat-stream` at 60.
  `scripts/check-vercel-output.mjs` fails the build gate unless every agent-chat function's
  `.vc-config.json` has `maxDuration >= 60`.
- **Probe.** `GET /api/duration-probe?ms=N` (auth-guarded by the template's middleware, N clamped to
  0..70,000) sleeps N ms and returns `{ ok: true, waitedMs }`. **In production it returns 404 unless
  `STIGI_ENABLE_PROBE=1`** (D16: open sign-up + a 70 s sleep would be compute abuse); in development it is
  always on. The skeleton deploy sets the flag, the skeleton e2e calls the deployed URL with 45,000 and
  58,000 ms (both must return 200), then the flag is removed and the app redeployed;
  `check-vercel-env.mjs` fails if the flag is still present and `e2e/probe-disabled.spec.ts` asserts the
  deployed probe answers 404. **Tripwire:** if the 45 s probe fails, the platform would kill agent turns
  before the framework's 40 s chunk boundary → STOP and ask the user.
- **Batch rule.** Every agent turn is one batch that fits one chunk: Teach = 1–2 reads + rename + one
  `move-notes` (≤ 20); Sort = 2 reads + ≤ 3 `create-cluster` + one `move-notes` (≤ 25; 40 reasoned moves measured too close to 35 s of model output). "Sort with agent" is
  a client-side loop: when a turn ends (`isGenerating` false), unsorted > 0, the loop is on and usage
  remains, it sends the next Sort handoff; the user can stop it; it stops on any error. The pre-sorted sample's 50 unsorted notes = 2 turns; a 200-note CSV = 8 turns.
- **Timing gate.** `TURN_BUDGET_MS = 35_000` (5 s inside the 40 s chunk, far inside 60 s): the live e2e
  asserts a Teach turn and a Sort-batch turn each finish under it, locally and on the deployed URL.
- **Flake rule (D17).** Timing specs run with one retry (`test.describe.configure({ retries: 1 })`). If the
  model misses 35 s on both attempts, the documented action is to set
  `AGENT_MODEL=anthropic/claude-haiku-5.5` (local `.env`; Vercel production env + redeploy) and re-run the
  gate — never to rewrite the flow, the batch sizes or the budget.

## 9. Live sync under polling (requirement 4; D13)

Serverless Vercel has no SSE fan-out without the Hosted Realtime Sync Gateway, but the money shot happens
in the user's own tab: the framework's `useDbSync` (mounted in `root.tsx`) invalidates action queries on
every **local chat-run tool completion** and at run end, delivered over the chat run's own streamed
response. The gateway only matters for other tabs/users, so it is not used. Belt and braces, the board's
`useActionQuery("get-board", {}, { refetchInterval })` polls every **2,000 ms while an agent run is
active** (`useAgentChatGenerating`'s `isGenerating`) and stops when idle.

**Glide-in.** Notes render as `motion` elements with `layoutId={note.id}` inside one `LayoutGroup`; when a
refetch changes a note's cluster, it animates from its old column to its new one (spring, ~450 ms;
instant under reduced motion). `diffAgentMoves(prev, next)` returns ids whose `clusterId` changed and whose
`movedBy === 'agent'`; those cards get an accent ring for 6 s. The reason chip stays until a user moves
the note.

**Observable state for tests.** The board root carries `data-agent-state="running|idle"`; every card
carries `data-note-id`, `data-cluster-id` (`unsorted` when null), `data-moved-by` (`agent|user|none`);
every column carries `data-cluster-id` and `data-cluster-name`.

## 10. UI (applies `docs/design/frontend.md`; kit at `docs/design/frontend-kit/`)

**Kind and deal.** Kind: software (`frontend.md` §1). Deal (run 2026-11-09 with
`node docs/design/frontend-kit/scripts/start.mjs`): palette `olive-on-bone`, type `host`, radius `soft`.
Stigi is an app inside the template shell, not a marketing page, so: the `:root` block becomes the
`.stigi` scope (the board root) to avoid restyling the template's shell; the kit's marketing layout
(hero, one-section-per-screen, photographs, moments, scenes, effects) does not apply; tokens, type scale,
radius, spacing, motion and the one-button/one-card rules do.

```css
/* app/styles/stigi-tokens.css — values printed by start.mjs; scoped to the board route wrapper */
.stigi-route, .stigi {
  --p-bg: #ecebe7; --p-surface: #e1dfd9; --p-ink: #38450f; --p-muted: #5a6537;
  --p-accent: #38450f; --p-accent-ink: #ecebe7; --p-action: #38450f; --p-action-ink: #ecebe7;
  --p-inv-bg: #38450f; --p-inv-surface: #435020; --p-inv-ink: #ecebe7; --p-inv-muted: #bbbfaf;
  --font-display: "Host Grotesk", system-ui, sans-serif;
  --font-text: "Host Grotesk", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  --display-weight: 500; --display-tracking: -0.035em;
  --t-label: 13px; --t-small: 14px; --t-body: 16px; --t-card: 18px; --t-h3: 24px;
  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-5: 24px; --s-6: 32px;
  --r-sm: 8px; --r-md: 12px; --r-lg: 20px; --r-btn: 8px;
  --btn-h: 44px; --btn-h-sm: 36px;
  --ease: cubic-bezier(.2, .7, .2, 1); --dur: 180ms;
}
```

Fonts load from the board route's `links()`:
`https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@400..700&family=JetBrains+Mono:wght@400..500&display=swap`.

**Layout (`/board`).** Template left sidebar | board | template agent sidebar (right). Board =
top bar, then a sticky left rail (the New-cluster zone above the Unsorted tray) beside a wrapping grid of
cluster columns (newest cluster first; each column scrolls internally), sized so every column is visible
at once on a 1920×1400 window, which the e2e drags rely on. `/board/report` opens the report pane on the right of the board (inside the
board area, left of the agent sidebar).

- **Top bar:** `h1` "Feedback board"; when sample notes exist, a chip `Sample data · pre-sorted starting
  layout`; counts (`N notes · K themes · U unsorted`); usage (`R of L agent turns left today`);
  Auto-teach switch; buttons: Import CSV, Sort with agent (toggles to Stop sorting while the loop runs),
  Report; a Reset board control (two-click confirm, no browser dialog).
- **First-run (D10, D15):** when the board has no notes, the board area shows only: heading "Sort
  customer feedback with an agent", one line "Load 200 synthetic sample comments for a fictional expenses
  app, already roughly sorted. Drag two notes into a new cluster to teach the agent a theme.", the one
  primary button **Load sample data (200 notes)**, and a quiet text link "or import your own CSV". One
  click reaches a pre-sorted board (6 imperfect clusters + 50 unsorted) where the money shot is two drags
  away, with no agent sort first.
- **Note card:** body (≤ 4 lines, then fade), agent reason chip (mono, `--t-label`, accent outline,
  prefixed "Agent:"), selected state (accent ring); click toggles selection; drag via `@dnd-kit/core`
  (PointerSensor with 6 px activation + KeyboardSensor); `DragOverlay` shows the lifted card.
- **Cluster column:** header = name, or "Untitled — drop one more note to teach the agent" (italic,
  muted); count; menu: More like these · Rename · Merge into… · Delete.
- **Selection bar** (≥ 1 selected): `N selected · More like these · Clear`.
- **Report pane:** markdown textarea (mono), Save, Write with agent, Export .md
  (`stigi-insight-report-YYYY-MM-DD.md`). If the user has unsaved edits when the agent saves, a notice
  "The agent updated the report · Load agent version" appears instead of overwriting.
- **Motion (kit `motion.md`):** cards lift 2 px on hover, buttons step on hover and press on click
  (scale .98), transitions use `--dur`/`--ease`; no scroll-linked motion; under
  `prefers-reduced-motion` everything rests (`MotionConfig reducedMotion="user"` + a CSS media block).
- **One system:** one primary button style (olive fill, bone text), one secondary (bone fill, olive
  1 px border), one card style, the one radius scale, no violet. Contrast: olive `#38450f` on bone
  `#ecebe7` passes WCAG AA.
- **Exception to the kit:** `frontend.md`'s "[sample-label]" check targets marketing pages. The event
  Rules require sample data to be labeled, so the sample chip and first-run copy stay.
- **Errors never silent (D11):** every mutation's `onError` shows a `sonner` toast with
  `actionErrorMessage(error)` (the template's `AppProviders` mounts the Toaster).

## 11. Production hardening (requirement 3; exactly this, nothing more)

- **Sign-in required.** `AUTH_DISABLED` is never set anywhere. The template's `runAuthGuard` middleware
  protects pages, actions and `/api/*`. Production uses email/password sign-up without an email provider,
  so `AUTH_REQUIRE_EMAIL_VERIFICATION=0` is set in Vercel (judges can sign up instantly; each account
  only sees its own board). The skeleton e2e asserts a signed-out visit to `/board` shows the sign-in form.
- **Per-user daily agent-turn cap.** `STIGI_DAILY_AGENT_TURNS` (default 40, positive integer). The
  agent-chat plugin's `prepareRequest` calls `guardAgentTurn({ ownerEmail, internalContinuation })`:
  continuations are not counted; otherwise it atomically increments `stigi_agent_turns` for
  `(owner, UTC day)` and, when the new count exceeds the limit, throws an h3 error with status **429**
  and message:
  > Demo credits for today are used: each account gets 40 agent turns per day. Your board is saved, and
  > dragging, editing and exporting still work. Agent turns reset at 00:00 UTC.
  (the number is the configured limit). The UI checks `get-agent-usage` before every Teach/Sort/Report
  handoff; at 0 it shows that same message as a toast and a persistent top-bar banner, disables
  Sort/More-like-these/Write-with-agent, and pauses auto-teach. **No global cap** (the OpenRouter key's
  credit limit is the backstop).
- **Key server-side only.** No `VITE_`-prefixed secret anywhere; `scripts/check-vercel-output.mjs` fails
  if any file under `.vercel/output/static` contains `sk-or-`.
- **No open compute probe.** `/api/duration-probe` is 404 in production unless `STIGI_ENABLE_PROBE=1`,
  which exists only during the skeleton's probe check (D16).

## 12. Deployment (requirements 1, 2, 5, 7; D6, D8, D9)

**Stack:** Vercel (Vercel CLI, `--prebuilt`) + Neon (pooled `DATABASE_URL`, optional
`DATABASE_URL_UNPOOLED` for migrations). Commands (from the framework's `vercel.mdx`):

```bash
pnpm migrate:production                                            # DATABASE_URL exported in the shell
NITRO_PRESET=vercel AGENT_NATIVE_VERCEL_CRON_SCHEDULE="0 9 * * *" pnpm build
node scripts/check-vercel-output.mjs
npx vercel deploy --prebuilt --prod                                # prints the production URL
```

**Vercel production env (names only):** `DATABASE_URL`, `BETTER_AUTH_SECRET` (≥ 32 chars, stable),
`CRON_SECRET`, `OPENROUTER_API_KEY`, `AGENT_ENGINE`, `AGENT_MODEL`, `AGENT_ENGINE_PREFER_BYO_KEY`,
`AUTH_REQUIRE_EMAIL_VERIFICATION`, `STIGI_DAILY_AGENT_TURNS`, `AGENT_NATIVE_RELEASE_MIGRATIONS` (=1:
release migrations own schema setup, request functions skip migration probes — same setting the
template's `netlify.toml` uses). `scripts/check-vercel-env.mjs` asserts all names exist in production
and that `STIGI_ENABLE_PROBE` is absent (`--allow-probe` relaxes only that check during the skeleton's
probe step).

**Walking skeleton first (plan #2).** Right after the scaffold: the bare app (template + DB plumbing +
a minimal `/board` page) deployed live on Neon with Better Auth sign-up/sign-in and
`pnpm migrate:production` working, verified by `e2e/deploy-skeleton.spec.ts` against `STIGI_PROD_URL`
(signed-out wall, fresh sign-up via `POST /_agent-native/auth/register` + `/login`, board heading, the
45 s/58 s duration probes). **Tripwire:** if the skeleton task is not PASS by **build hour ~5**, the
orchestrator STOPS and asks the user whether to downgrade to a local-only demo.

**Milestone redeploys.** M1 after the money-shot slice (gate: deployed `money-shot.spec.ts`), M2 after
sort + report (gate: deployed `sort-batch` + `report-export` specs), M3 final (gate: full deployed suite +
output check). **Dependency rule (D8):** deploy tasks depend on the code they ship; **no build task
depends on any deploy task**; M1/M2 gate only themselves; only M3 blocks the submission (Step 3). The
orchestrator keeps dispatching build tasks while a deploy task waits for the user. All
signup/secret/deploy tasks are `human_gate: true` with `gate_profile` (`account`, `secret`, `deploy`).
The user creates the Neon and Vercel accounts in parallel; the OpenRouter key already exists (no task).
The repo-public flip stays a Step-3 consent gate.

## 13. Error handling

Actions fail with stable `errorCode`s (`unauthenticated` 401, `cluster_not_found`/`note_not_found` 404,
`sample_already_loaded` 409, `no_comments`/`too_many_notes`/`reason_required`/
`agent_move_requires_reason`/`invalid_input` 400). The agent sees these as tool errors and corrects
itself; the UI shows them as toasts. The sort loop stops on any failed or empty turn (no unsorted count
decrease). The 429 cap error is pre-empted by the UI usage check and explained in the banner.

## 14. Testing strategy and gates

- **Unit (vitest, in-memory PGlite via the template's `DATABASE_URL=pglite:memory`):** every action, CSV
  parser, board store, agent-usage guard, duration-probe clamp, view-screen (app-state mocked). Tests
  call `action.run(args, { userEmail, caller })` with `caller: "frontend"` (user) or `"tool"` (agent).
  `server/db/test-db.ts` applies `STIGI_MIGRATIONS` and clears the tables.
- **Component/logic (vitest + happy-dom + Testing Library):** auto-teach rule, agent-move diff, drop
  resolution, handoff builders, sort-loop step, report file name; NoteCard, ClusterColumn, EmptyBoard.
- **E2E (Playwright 1.65, chromium):** `local` project (starts `pnpm exec agent-native dev --port 8080
  --strictPort` unless one is running) and `deployed` project (`STIGI_PROD_URL`). Specs: `board-dnd`
  (no key), `report-export` (no key), `money-shot` (key; timing + no-reload + ≥ 6 agent-moved notes with
  reasons + ≥ 2 board updates during the turn), `sort-batch` (key; one batch of 20–25 notes, timing),
  `deploy-skeleton` (deployed; auth wall, sign-up, probes).
- **Only these tasks need `OPENROUTER_API_KEY`:** the live money-shot e2e (local), the live sort-batch
  e2e (local), and the M1/M2/M3 deployed gates. Every other gate is deterministic. The live money-shot
  and M1 gates run on the pre-sorted sample layout with no prior sort (D15).
- **Timing flake rule (D17):** one retry; two misses → switch `AGENT_MODEL` to
  `anthropic/claude-haiku-5.5` via env and re-run; never rewrite the flow.
- **Sample label:** every task that touches sample data keeps the "sample" label (`source:'sample'`,
  `created_by:'sample'`, the chip, the first-run copy, the README and the report's source line).
- **Smoke:** `pnpm typecheck` (~55 s), `pnpm build` (~3 min), the Vercel build + output check (~2.5 min).

## 15. Plans and ordering

Five plans, one per subsystem, ordered as a vertical slice. All in `docs/superpowers/plans/`:

1. `2026-11-09-stigi-foundation.md` — scaffold to repo root, env example, DB plumbing, shared types,
   owner/caller helpers, test DB, minimal `/board` page + nav + home path.
2. `2026-11-09-stigi-deploy.md` — nitro config + probe route + output/env checks, Playwright + auth
   helper + skeleton spec, and the human-gated accounts → env → skeleton deploy with the probe flag
   (tripwire) → probe-off redeploy, plus the M1/M2/M3 redeploy tasks (numbered 50–52; each depends only
   on the code it ships and the probe-off task; nothing depends on them except Step 3 on M3).
3. `2026-11-09-stigi-board.md` — the money-shot slice: sample data, CSV, board store, all board actions,
   view-screen, usage guard + cap, tokens, board UI with DnD and glide-in, selection app-state, auto-teach,
   agent instructions + system prompt, no-key DnD e2e, live money-shot e2e.
4. `2026-11-09-stigi-sort-report.md` — sort loop + skill + live timing e2e, merge/delete UI, report
   actions/pane/export + skill + e2e, CSV import dialog.
5. `2026-11-09-stigi-ship.md` — README (schema `R1-web-app v1`), final typecheck/build gate.
6. `2026-11-09-stigi-landing.md` — the public landing page at `/` (§18), added mid-build as new tasks 60–64.

**Cut order if behind (D12, amended):** stretch (undo last agent batch, multi-select drag, CSV column picker — no
task on the critical path) → landing moments/scenes (`landing:63`) → merge/delete polish → CSV edge cases.
Never cut: money shot, deploy skeleton, report, tests, or the landing hero + CTA once built.

## 16. Submission facts (pre-filled in `docs/gates/submission-draft.md`)

Project name **Stigi**; one-liner from §1; pre-existing work: the Agent-Native `chat` template scaffold
(`@agent-native/core@0.226.0`), `@agent-native/toolkit` components (AgentSidebar, app shell), the
`design-taste-frontend` kit tokens/motion; everything in `actions/`, `app/routes/board*`,
`app/components/board/`, `server/db`, `server/lib`, `shared/`, skills and e2e built during the event
(2026-11-09). Sample data: 200 synthetic comments for a fictional app, labeled in-app.

## 17. Risks

| Risk | Mitigation |
|---|---|
| Vercel plan kills functions before 40 s | explicit maxDuration 60 + deployed duration probe + tripwire |
| Teach turn too slow on Sonnet 5.5 | one read + one write design, ≤ 20 moves, 35 s gate; fallback `AGENT_MODEL=anthropic/claude-haiku-5.5` |
| Agent omits reasons | `move-notes` rejects agent moves without a reason (`reason_required`) and the skill demands them |
| Better Auth endpoint/CSRF details | e2e auth helper sends `Origin`; validated locally before the deploy gate |
| Framework churn | exact pin `0.226.0`; scaffold verified 2026-11-09 |
| dnd-kit + motion layout conflicts | `DragOverlay` for the lifted card; the source card fades during drag; layout animation only on refetch |

## 18. Landing page at `/` (D18–D20; plan `2026-11-09-stigi-landing.md`, tasks 60–64)

**Surfaces.** One design system, two surfaces (`docs/design/frontend-kit/README.md`): the board app
(`/board`: tokens, type, radius and motion only, §10) and the landing page (`/`: the full skill workflow).

**Serving.** The landing is a skill-native static page, `public/landing/index.html`, with copies of the kit
assets it uses under `public/landing/assets/`, all referenced root-relative (`/landing/assets/…`).
`scripts/build-landing.mjs` compiles the HTML into `server/landing/landing-html.ts` (`--check` fails when
stale). The scaffold's Nitro route `server/routes/index.get.ts` returns that string for `/`, outside React
Router, so the page carries no app shell. On Vercel, `/` is the `index.func` function and `/landing/*` are
static files.

**Auth (top tier, `landing:60`).** `server/plugins/auth.ts` sets `rootAuth: false`, so the guard no longer
answers `/` with the sign-in page, and `publicPaths: ["/", "/landing"]`. The guard's `matchesPathList`
treats `"/"` as exact, so only `/` and `/landing/*` become public. `/board` and every other page keep the
sign-in wall: an anonymous SSR shell plus the client gate, unchanged.

**Verified in a throwaway 0.226.0 scaffold on 2026-11-09:**
- a signed-out `GET /` returns 200 `text/html` from the route;
- `/landing/*` (`.css`, `.js`, `.json`, `.webp`, `.html`) returns 200 signed-out.

**Tests.** `e2e-landing/landing-public.e2e.ts` runs with its own `playwright.landing.config.ts` (testDir
`e2e-landing`, `*.e2e.ts`, so Vitest's default include and the default Playwright config never pick it
up). It asserts a signed-out `GET /` is 200 with the landing h1, and that a signed-out `/board` shows the
sign-in screen. `scripts/lib/landing-content.test.mjs` (Vitest) checks:
- the declared kind and the deal;
- the h1;
- exactly three `Try Stigi` → `/board` anchors (nav, hero, close);
- the section order;
- the honesty rules (D19);
- the photograph and font credits;
- the synthetic-sample disclosure.

**Skill checkers (`landing:62`).** `scripts/check-landing.mjs` starts the dev server
(`scripts/with-dev-server.mjs`) and runs `docs/design/frontend-kit/scripts/consistency.mjs` and
`docs/design/frontend-kit/assets/layout/check.mjs` against `http://localhost:8091/` (the landing's own dev server, with its own PGlite folder `data/pglite-landing`,
so it never collides with the main e2e suites on :8080 running in parallel) at the skill's widths and sizes. Every FAIL is fixed in the page, never in kit files. The checkers drive system Chrome.

**Page.** Kind software, the deal in D20. Sections:

| id | content |
|---|---|
| `top` | hero split: h1 "The feedback board for product teams", the board screenshot and a float card |
| `how` | app-frame: a wide screenshot of the whole board |
| `teach` | split-text-left: screenshot of two seeds in a new cluster |
| `steps` | four steps: screenshot of the selection bar |
| `actions` | dark band: lanes diagram, optional `iris-opens` moment (`landing:63`) |
| `by-hand` | detail photograph `d183` |
| `faq` | the calm section |
| (footer) | close-type plus footer-statement, with the one credits line |

The main action, word for word in nav, hero and close, is **Try Stigi** → `/board`. Signed-out visitors
sign in there and land on their board. The sample disclosure is one FAQ line, "200 synthetic sample
comments for a fictional expenses app"; it passes the checker's `sample-label` rule and satisfies the
Rules. All copy is fixed verbatim in the plan.

**Production.** `landing:64` (human-gated deploy) redeploys and runs the landing e2e against the deployed
URL. `deploy:52` (M3) depends on it. The default deployed suite and its "8 passed" expectation are
unchanged.
