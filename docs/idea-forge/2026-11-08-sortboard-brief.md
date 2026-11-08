# Idea Forge Brief — Sortboard: a feedback board you sort together with an agent

> Working title **Sortboard** is provisional; the builder may rename it. Name check (2026-11-08): no
> feedback product uses the name. Cito (NL) used it for a 2021 classroom empathy prototype, and a
> small GitHub library shares it. This brief is the single source of truth handed to the architect
> (Step 1). It fixes *what* and *why*, not *how*.

## Event + constraints

- **Date written:** 2026-11-08 (Step 0, idea-forge, `claude-opus-5-5`, effort max).
- **Hackathon:** Agent-Native Hackathon (Builder.io).
  - Event: https://www.builder.io/hackathon
  - Official Rules (controlling): https://www.builder.io/hackathon/rules
  - Submit: https://www.builder.io/hackathon/submit
  - Resource pack: `docs/resources/2026-11-08-agent-native-hackathon/` · Tollgate: `docs/tollgate/2026-11-08-tollgate.md`
- **Hard deadline** (calendar fact; idea-forge did not gate on it): **Mon 2026-11-09 23:59 PT =
  2026-11-10 07:59 UTC = 08:59 WAT** (Rules).
- **Project repo:** `Dotman-Bei/agent-native-hackathon-2026` (private), renamed to
  `Dotman-Bei/sortboard` right after this brief is pushed (`references/repo-bootstrap.md` §The rename step).
- **Team:** the builder plus the autonomous pool (architect → orchestrator and executors → reviewer).
  Builder skills: TypeScript/React (this build's stack), Python/ML, Solidity/DeFi.
- **Tracks:** none exist. There are no tracks and no bounties; one weighted ranking pays all cash
  ($5,000 / $2,500 / $1,500 / $750 / $250). Recognition categories aimed at, in order: Best Overall
  App · Best Use of Agent-Native · Best Productivity App (non-cash).
- **Risk posture:** safe-feasible.
- **Hard facts this brief respects (from the pack):**
  - The app must genuinely connect agent and UI through shared `defineAction()` actions, shared data
    and shared app-state. "Naming or importing the framework alone is not enough." Rankings stay
    provisional until "framework use" is verified.
  - The agent needs an LLM path (tollgate C3, unprobed): a Builder.io connection, a provider key, or
    local Ollama.
  - The demo is a **public Clips recording of the actual app in use**, recorded by the builder and
    "viewable without a login or access request" (no password, no expiry). A recording made with
    another tool doesn't count, and recording alone does not submit an entry.
  - The submission must name pre-existing work: the `chat` template scaffold, any Toolkit components,
    and what changed since 2026-10-27.
  - No external approvals, and no data the builder doesn't control. The demo runs on synthetic sample
    feedback, labeled as sample in the app and in the submission. The Rules disqualify "fabricated
    demonstrations"; sample data processed by the real app and agent is not that.
- **UI doctrine:** `docs/design/frontend.md` binds all UI (see the kickoff's CONSTRAINTS line).

## Problem

Product teams sit on hundreds of raw customer comments: support tickets, NPS verbatims, app-store
reviews, interview notes. Turning them into themes is manual sticky-note work that costs a PM or
researcher hours, so it happens rarely or not at all. One-shot AI summaries don't fix it. When the AI
groups things wrong, the only remedy is re-prompting from scratch, because a correction made by hand
doesn't carry to the rest of the pile.

## Solution (one line)

A feedback board where an agent sorts hundreds of customer comments into themes, you drag a few notes
to correct it, and it re-sorts the rest to match, then writes the insight report.

## Must-have demo features (the minimum that makes the money shot land)

1. **The agent sorts an imported batch onto a live board.** Paste or upload a CSV of about 200
   comments. The agent reads them through an action and files them into named theme clusters by
   calling the same deterministic actions the UI uses (create, rename, move). Notes land on the board
   batch by batch while it works (live sync). The agent does the sorting: no action and no UI code
   calls an LLM inline.
2. **Teach by dragging.** The user drags notes between clusters, renames, merges, or starts a cluster
   by hand, and each gesture is the same shared action the agent calls. Selecting two or more notes and
   asking for "more like these" (a button that hands off through `sendToAgentChat`, or the chat) gives
   the agent the selection through app-state (`selection` plus `view-screen`). The agent names the
   theme and moves every matching note from anywhere on the board into it. Each move shows a one-line
   reason on the note.
3. **A usable outcome: the insight report.** The agent writes a ranked report from the board's current
   state into an editable pane: themes by size, two or three verbatim quotes each, and a suggested next
   step. The user edits it and exports Markdown.

## Target sponsor track(s)

No tracks or sponsor bounties exist (FAQ: "No assigned tracks. No prescribed use cases."). The build
aims at the single ranked rubric and three recognition categories:

- **Best Overall App:** "The strongest combination of usefulness, technical execution, and user
  experience." Sortboard shows a complete flow on one screen: import, sort, steer, report, export.
- **Best Use of Agent-Native:** "Thoughtful, demonstrated use of the framework to connect agent
  capabilities, the interface, and application behavior. Naming or importing the framework alone is
  not enough." Every drag and every agent move goes through one action layer, the agent sees the
  user's selection, and its moves appear live.
- **Best Productivity App:** "The most effective application for helping people get things done,
  whether at work or in everyday life." Hours of affinity sorting become minutes.

## Judging criteria (published)

Official Rules, verbatim:

- **Usefulness and Execution: 40%.** "A clear problem and a complete working flow. Does the project
  deliver a useful outcome, reduce manual effort, and make that outcome usable?"
- **Creativity and Design: 20%.** "An imaginative idea or interaction. What makes the experience
  distinctive and enjoyable to use?"
- **Innovation: 20%.** "A thoughtful people-and-agent workflow that improves how something gets done,
  rather than adding AI without a clear purpose."
- **Cleverness and Use of Agent-Native: 20%.** "Resourceful use of Agent-Native to bring the
  interface, agent behavior, and application capabilities together."

"Judges score each criterion from 0 to 10." The mean weighted total across judges ranks the entries.
Ties break on Usefulness and Execution, then Creativity and Design, then Innovation, then Cleverness.
Rankings stay provisional until "eligibility, originality, framework use, demo accessibility, and
compliance are verified."

The event page's "What makes a strong entry", verbatim: "An agent with a purpose" · "An interface that
puts users in control: Let users explore results, make edits, and guide the agent's next steps." · "A
connected experience: Make the UI and agent work with the same data and actions, so users can move
between direct interaction and agent assistance."

How Sortboard maps to the criteria:

| Criterion | What covers it |
|---|---|
| Usefulness and Execution | The problem plus the complete flow |
| Creativity and Design | The board and the drag-to-teach gesture |
| Innovation | The human teaches by doing; the agent generalizes |
| Cleverness and Use of Agent-Native | One action layer, app-state selection, live sync |

## Why it wins

Unlike Builder's own **Analytics** (plain-language questions over connected data, answered as charts),
**Brain** (cited answers from company knowledge) and **Forms** (which collects feedback but doesn't
synthesize it), no first-party Agent-Native app turns raw qualitative feedback into themes. The
template list and a code search of `BuilderIO/agent-native` on 2026-11-08 found no feedback-synthesis
app or template.

Head-to-head on the published criteria, Sortboard wins **Innovation** and **Creativity and Design**:
the user steers the agent by dragging notes instead of writing prompts, and the drag and the agent's
follow-up are the same shared action. It honestly **ties** Analytics on Usefulness and Execution (a
different job, an equally complete flow) and the framework's own apps on Use of Agent-Native.

## Demo money shot (~15 seconds)

On a board of about 200 sorted comments, the user drags two stray notes ("which plan am I even on?"
and "the billing page makes no sense") into empty space to start a cluster. The agent names it
**Plan & billing confusion**. A beat later, about a dozen more notes glide in from clusters across the
board, each showing a one-line reason. One gesture taught the agent, and no prompt was written.

## Out of scope (explicit)

- Live connectors to feedback sources (Intercom, Zendesk, app stores, Slack, Builder's hosted Forms).
  Import is CSV upload or paste only.
- Embeddings, vector search, fine-tuning, sentiment models, or any Python/ML service. The agent sorts
  through deterministic actions, and the demo dataset is about 200 to 300 notes.
- Multi-user real-time collaboration (Yjs), sharing, teams and orgs. One user plus the agent.
- Charts, dashboards and trends over time (Builder's Analytics territory).
- Inline LLM calls in actions or UI (framework rule 2). All AI work goes through the agent.
- Claims of persistent cross-session learning. Corrections steer the current board; observational
  memory is thread compaction, not preference learning.
- Production hardening (rate limits, billing, SSO). A public live deploy is optional; the Rules call
  it "encouraged but not required".
- Anything on-chain (the campaign tollgate struck Web3).
- The Clips recording itself (the builder records it at Step 3).

## Feasibility notes for the architect (primitives, not design)

Transcribed from `docs/resources/2026-11-08-agent-native-hackathon/sponsors/agent-native.md` (Step 0a,
`gh api` on `BuilderIO/agent-native` `main`, 2026-11-08) unless marked **Step 0 check**. The pack holds
the full option tables.

### Package and prerequisites

- `@agent-native/core` (npm), MIT. Latest release **v0.1.293 (2026-11-06)**, "Pre-1.0 and released
  very often", so pin the exact version once scaffolded.
- "Node.js 22.22 or later." This machine has v22.17.1: **tollgate C1 FAIL, upgrade before Step 2.**
  pnpm on PATH: C2 PASS (10.33.0).

### Scaffold

```bash
npx --yes @agent-native/core@latest create my-app --standalone --template chat
cd my-app
corepack enable
pnpm install
pnpm dev            # opens browser UI; port 8080 (increments if busy)
```

Locally, the Welcome screen offers "Continue as local dev". CLI action runner:
`pnpm action <name> --arg=value`. Telemetry opt-out: `DO_NOT_TRACK=1`.

### Project structure

```
AGENTS.md                         # always-on agent instructions (loaded every turn)
.agents/skills/<name>/SKILL.md    # reusable agent behavior (loaded on demand)
actions/<name>.ts                 # defineAction() files, auto-discovered; filename = action name
app/routes/*.tsx                  # React Router routes (restart dev server to discover new routes)
app/hooks/use-navigation-state.ts # the app's own hook (not a framework import): UI↔agent navigation
app/root.tsx                      # app shell; calls useNavigationState() once
server/db/index.ts                # exports getDb() and schema (Drizzle)
agent-native.config.ts            # typed, non-secret public app config
react-router.config.ts, vite.config.ts, netlify.toml, .env.example, jobs/, shared/
```

### `defineAction()`

Signature: `defineAction(config: DefineActionConfig<TSchema, TReturn, TOutputSchema>): ActionDefinition<TInput, TReturn>`.
"Only description, schema, and run are required." Export it as the file's default export.

```ts
import { defineAction, fail } from "@agent-native/core/action";
import { z } from "zod";
import { getDb, schema } from "../server/db/index.js";

export default defineAction({
  description: "Reply to an email thread in the user's voice.",   // the agent reads this
  schema: z.object({
    emailId: z.string().describe("The id of the email to reply to."),
    body: z.string().describe("The reply body, in markdown."),
  }),
  // http: { method: "GET" },  // default POST /_agent-native/actions/<name>
  run: async ({ emailId, body }, ctx) => {
    const db = getDb();
    await db.insert(schema.replies).values({ emailId, body });
    return { ok: true, emailId };
  },
});
```

- `schema` is a StandardSchemaV1 (Zod v4, Valibot or ArkType). Invalid input never reaches `run`, and
  arguments must be plain data.
- `http` defaults to `POST /_agent-native/actions/<name>`; `false` means agent and CLI only. "A `path`
  override makes the hooks 404."
- Other options: `readOnly` (auto-true for GET), `needsApproval` ("Pauses the agent loop for human
  approval before run()"), `agentTool: false` (hides it from the agent), `endsTurn`, and `chatUI`
  (a native chat renderer for the result).
- Fail with `fail(message, { errorCode?, statusCode?, details? })` (400 by default). "Returning
  `{ error: "..." }` instead looks like success."
- Result contract: return `id`, a one-line `message`, and optionally `nextRequiredAction`. Keep the
  surface small: prefer one CRUD-style `update` action with a patch, use `verb-noun` names, and mark
  UI-only actions `agentTool: false`.
- One action, every surface: agent tool · `useActionQuery`/`useActionMutation` · HTTP · CLI · MCP · A2A.

### UI ↔ agent shared data

```ts
import { useActionQuery, useActionMutation, callAction, useDbSync, actionErrorMessage } from "@agent-native/core/client/hooks";
const { data, isLoading } = useActionQuery("list-tickets", {});           // (actionName, params, options?: UseQueryOptions) → UseQueryResult
const { mutate, isPending } = useActionMutation("send-ticket-reply");      // (actionName, options?: UseMutationOptions) → UseMutationResult; input goes to mutate()
await callAction("update-ticket", { ... });                                // (actionName, params, { method?, signal?, timeoutMs? }) → Promise<TResult>
```

- A successful mutation "emits a change event with `source: "action"`, so every `useActionQuery()`
  reading affected data refetches automatically."
- Agent tool runs invalidate the current tab's action queries automatically. Use `useDbSync` only for
  changes made without the user acting.
- "All calls have a 60 s timeout." Queries retry 429/502/503/504 up to 3 times; mutations never retry.

### Shared app-state

```ts
import { readAppState, writeAppState } from "@agent-native/core/application-state";  // server / agent side
const navigation = await readAppState("navigation");
await writeAppState("navigate", { view: "inbox", threadId: "thread-123" });           // the agent moves the UI
// browser side:
import { setClientAppState, writeClientAppState, readClientAppState, deleteClientAppState } from "@agent-native/core/client";
// UI → agent chat handoff:
import { sendToAgentChat } from "@agent-native/core/client/agent-chat";
sendToAgentChat({ message: "Generate a chart showing signups by source", context: "Dashboard ID: main", submit: true });
```

- `navigation` is owned by the UI: "the agent must never write to it directly".
- `navigate` is a one-shot agent → UI command; the UI never writes it.
- `selection` is durable selection: "store IDs, not records".
- `pending-selection-context` is one-shot highlighted text.
- "Every template should have a `view-screen` action. It reads navigation and selection state, fetches
  the relevant data, and returns a snapshot of what the user sees. This is the agent's eyes." Call it
  before acting on the current UI.
- "The UI never calls an LLM directly." Server code uses `agentChat.submit()` / `agentChat.prefill()`.

### Data

```ts
import { table, text, integer } from "@agent-native/core/db/schema";
export const forms = table("forms", { id: text("id").primaryKey(), title: text("title").notNull(), createdAt: integer("created_at").notNull() });
```

- PGlite runs locally when `DATABASE_URL` is unset; production uses Postgres via `DATABASE_URL`.
- Inspect with `pnpm action db-schema` and `pnpm action db-query --sql "SELECT …"`.
- The production agent's raw SQL is read-only by default, so writes go through typed actions.
- Core tables are auto-created: `application_state`, `settings`, `oauth_tokens`, `sessions`.

### Architecture rules (verbatim)

1. "Data lives in PostgreSQL: all app state lives in the database via Drizzle ORM."
2. "All AI goes through the agent: no inline LLM calls; every AI interaction flows through the agent chat bridge."
3. "Actions for agent operations: complex work runs as a typed action, not inline code."
4. "Live sync keeps the UI in sync: database changes stream over SSE, with polling as the universal fallback."
5. "Application state in PostgreSQL: ephemeral UI state lives in the database, readable by both agent and UI."

**Four-area checklist** ("Every user-facing feature should update all applicable areas"): UI · Action ·
Skills (`AGENTS.md` and/or a skill) · App-State. "A feature with only UI is invisible to the agent. A
full UI feature with only actions is invisible to the user. A feature without app-state means the
agent is blind to what the user is doing."

### LLM path (tollgate C3): env-var names only, never values

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic Claude fallback |
| `OPENAI_API_KEY` (+ optional `OPENAI_BASE_URL`) | OpenAI / OpenAI-compatible |
| `OPENROUTER_API_KEY` | OpenRouter |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini |
| `AGENT_ENGINE` | force an engine: `anthropic`, `ai-sdk:openai`, `builder`, `codex-cli` |
| `AGENT_ENGINE_PREFER_BYO_KEY` | prefer your key over the managed Builder gateway |

"Connect with **Use Builder.io**, add a key through **Custom keys**, or set a provider key in `.env`
for local development." Choose the model in Settings. Local Ollama is also listed.

### Deploy (optional for judging)

- Set `NITRO_PRESET` to `node`, `vercel`, `netlify` or `cloudflare_module`.
- Required: `DATABASE_URL` (persistent Postgres) and `BETTER_AUTH_SECRET` (≥32 chars, stable).
  Optional: `BETTER_AUTH_URL`, `APP_URL`.
- Run `pnpm migrate:production` ("Do not skip this step").
- "Continue as local dev" works only locally, and the local PGlite database must not be used in
  production.
- Config health: `/_agent-native/ping?configuration=1`.
- "Serverless production syncs by polling unless the Hosted Realtime Sync Gateway is used."

### Gotchas

- New routes need a dev-server restart.
- `http.path` overrides break the hooks.
- A hosted Builder.io workspace runtime blocks the env-key fallback.
- The framework repo ships `CLAUDE.md`, `AGENTS.md`, `.claude/`, `skills/` and a `/visual-edit` Claude
  Code skill that can be used during the build.

### Step 0 checks (2026-11-08, `gh api`, docs source on `main`)

- **`durable-background-runs.mdx`:** a hosted agent turn is capped by the platform request timeout
  ("60s on Netlify, and the framework's ~40s soft-timeout") and then continues from where it left
  off. "A tool-call journal records what already ran, so continuing never repeats a write." A sorting
  turn that makes many action calls is supported.
- **`toolkit-editors-canvases.mdx`:** "Toolkit does not provide the canvas document, rendering model,
  or persistence." The board model is app-owned. Toolkit does ship `<SharedRichEditor>` ("markdown
  in/out"), which could serve the editable report pane.
- **`agent-teams.mdx`:** sub-agents "run in their own threads and appear as live preview chips inline
  in chat", with state "under `agent-task:<taskId>`" in `application_state`. Optional for parallel
  sorting, not required.
- **`observational-memory.mdx`:** "Background three-tier compaction … that keeps long agent threads
  cheap". It is not preference learning, so don't build on it.
- **Not read by Step 0a or Step 0** (read at Stage 1 if used): `client-agent-chat`, `file-uploads`,
  `progress`, `generative-ui`, `native-chat-ui`, `actions-run-context`, `drafts`, `skills-guide`,
  `writing-agent-instructions`.
- **`docs/design/frontend.md` points at files that aren't here.** It references `<skill>/assets`,
  `scripts/*.mjs` and `references/*.md` (`starter.html`, `deal.mjs`, `consistency.mjs`, `check.mjs`
  and others). None of them are in this repo or under `~/.claude` on this machine; only the skill's
  text was copied. Plan the frontend tasks with that in mind.

### Day-1 external dependencies

1. **The LLM path** (tollgate C3). Every agent turn needs it. Pick a provider key or the Builder.io
   connection, and keep only the env-var name in plans, with the value in the git-ignored `.env`.
2. **Node ≥22.22** (C1), before Step 2.
3. **A Clips account** (C4), for the Step 3 recording.

### Sample data

About 200 synthetic customer comments for a fictional product, labeled as sample. Write some themes
to overlap, such as billing comments that also read as onboarding problems or bug reports. That
overlap is what makes teaching by dragging visible.

### Longest pole

The board: drag-and-drop between clusters, with the agent's moves animating in as live sync
refetches. Second, the agent's sorting instructions (`AGENTS.md` plus a skill). Everything else is
CRUD actions on a few tables.

## Rubric mapping (why this won, for the record)

Weights were adapted to the published 40/20/20/20 rubric with buildability kept highest and the
safe-feasible nudge applied (+5 buildability, −5 novelty): **intrinsic buildability / complete working
flow 40 · usefulness + Agent-Native fit 25 · demo WOW + design 20 · novelty (white space vs Builder's
apps) 15.**

The field had 37 candidates: 29 originals plus 8 bolder-pass rewrites. Four were knocked out at the
buildability gate:

- a Web3 treasury desk (the campaign struck Web3, and it needs faucet funds);
- a Clips bug-report reader (it depends on hosted Clips access);
- a price-drop agent (it depends on live retailer pages);
- a bill negotiator (it needs benchmark data the builder doesn't have).

Sortboard scored **485**. An event seating planner came second at 435, after losing Usefulness and
Execution head-to-head against Calendar (seating is a once-per-event job). A shift-roster builder
came third at 415, because it only ties Calendar ("find cover" has the same shape as "find time").
The pressure test found no hidden blocker in the top three: no data, approval or service beyond the
LLM path that every entry needs.
