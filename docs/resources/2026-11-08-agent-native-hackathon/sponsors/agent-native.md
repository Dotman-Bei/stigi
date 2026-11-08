# Sponsor: Builder.io — Agent-Native framework (DEEP)

| | |
|---|---|
| Docs | https://www.agent-native.com/docs/ (source: `packages/core/docs/content/*.mdx` in the repo) |
| Repo | https://github.com/BuilderIO/agent-native, MIT, ~7.6k stars, last push 2026-11-08T19:42Z |
| Latest release | **v0.1.293** (2026-11-06). Pre-1.0 and released very often, so expect churn |
| Package | `@agent-native/core` (npm) |
| Fetched | 2026-11-08 via `gh api` (raw markdown from `main`) plus Chrome for the rendered event page |

## What they reward

The 20% "Cleverness and Use of Agent-Native" criterion and the "Best Use of Agent-Native" category reward
*"Resourceful use of Agent-Native to bring the interface, agent behavior, and application capabilities
together"*. *"Naming or importing the framework alone is not enough."* Event-page pitch: **"One action.
Shared across your app. Define a capability once with `defineAction()`. Your React UI, agent, and
integrations call the same code."**

## Framework model (from README + key-concepts.mdx)

- **Shared actions:** "The agent calls each capability as a tool, and the UI calls it from code. Both paths use the same validation, permissions, and implementation."
- **Shared data:** "Work done by the agent appears in the UI, and work done in the UI is available to the agent."
- **Shared application state:** "The agent receives relevant UI state, such as the current page, selected record, or active view."
- "The agent does not click through the UI. It works through the same action layer as the UI."

**Five architecture rules (key-concepts.mdx, verbatim):**
1. "Data lives in PostgreSQL: all app state lives in the database via Drizzle ORM."
2. "All AI goes through the agent: no inline LLM calls; every AI interaction flows through the agent chat bridge."
3. "Actions for agent operations: complex work runs as a typed action, not inline code."
4. "Live sync keeps the UI in sync: database changes stream over SSE, with polling as the universal fallback."
5. "Application state in PostgreSQL: ephemeral UI state lives in the database, readable by both agent and UI."

**Four-area checklist** ("Every user-facing feature should update all applicable areas"): 1. UI · 2. Action
(`actions/`) · 3. Skills (`AGENTS.md` and/or a skill) · 4. App-State (navigation state, view-screen data,
navigate commands). "A feature with only UI is invisible to the agent. A full UI feature with only actions is
invisible to the user. A feature without app-state means the agent is blind to what the user is doing."

**Three layers:** Core (actions, Postgres/PGlite + Drizzle, auth, app state, agent execution, routing, live
sync) · Toolkit (optional UI/product pieces) · Templates (optional complete apps you fork).

## Scaffold / install

Prerequisites (getting-started.mdx, verbatim): "Node.js 22.22 or later" · "pnpm available on your PATH (run
`corepack enable` in the generated app if it is not)" · "Optional while setting up; required to run the agent:
Builder.io, an Anthropic/OpenAI key, or local Ollama".

```bash
npx --yes @agent-native/core@latest create my-app --standalone --template chat
cd my-app
corepack enable
pnpm install
pnpm dev            # opens browser UI; port 8080 (increments if busy)
```
- Locally, the Welcome screen offers **"Continue as local dev"**, so no email or password is needed.
- The event page shows a shorter variant: `npx --yes @agent-native/core@latest create my-app` (no `--standalone --template`).
- Template choices (`templates/` in the repo): analytics, assets, brain, calendar, chat, clips, community, content, crm, design, dispatch, factory, forms, mail, plan, slides, tasks, videos.
- Peer-dependency errors: "Run `npx clear-npx-cache` to clear the cache, then run the commands again."
- The CLI collects anonymous telemetry; opt out with `DO_NOT_TRACK=1` or `AGENT_NATIVE_TELEMETRY_DISABLED=1`.
- Automation-first apps can run with `pnpm agent`. CLI action runner: `pnpm action <name> --arg=value`.

## Project structure (key-concepts.mdx, getting-started.mdx, context-awareness.mdx, clips template root)

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
Core Postgres stores auto-created in every template: `application_state` (key/json value: ephemeral UI
state), `settings`, `oauth_tokens`, `sessions`.

## `defineAction()` (actions-defining.mdx)

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

**Signature:** `defineAction(config: DefineActionConfig<TSchema, TReturn, TOutputSchema>): ActionDefinition<TInput, TReturn>`.
"Only description, schema, and run are required." Export it as the file's default export.

| Field | Type | Notes (verbatim or close) |
|---|---|---|
| `description` | `string` | "What the agent reads to decide when to call this action." |
| `schema` | `StandardSchemaV1` | Zod v4, Valibot, or ArkType. Converted to JSON Schema for the tool; invalid input never reaches `run`. Arguments must be plain data |
| `run` | `(args, ctx?) => Promise<TReturn> \| TReturn` | "The single implementation every surface calls." |
| `http` | `ActionHttpConfig \| false` | `{ method: "GET"\|"POST"\|"PUT"\|"DELETE", path? }`; `false` = agent and CLI only. A `path` override makes the hooks 404 |
| `readOnly` | `boolean` | Auto-true for GET; skips UI poll-refresh and write-audit. "Not access control." |
| `outputSchema` / `outputErrorStrategy` | schema / `"strict"\|"warn"\|"fallback"` | Validates the return value; default strict |
| `errors` | `defineActionErrors(...)` | Closed set of error codes |
| `needsApproval` | `boolean \| (args, ctx) => boolean` | "Pauses the agent loop for human approval before run()." |
| `agentTool` / `mcpTool` | `boolean` | Hide from the agent / from MCP and A2A |
| `endsTurn` | `boolean` | Hands control to the user (question form) |
| `deferLoading` | `boolean` | `false` = in the first tool list; others load via tool-search |
| `authorize` | `ActionAuthorize<TInput>` | Per-caller guard |
| `chatUI` | `ActionChatUIConfig` | Native chat renderer for the result |
| `parallelSafe`, `link`, `mcpApp`, `publicAgent`, `audit`, `toolCallable`, `mcpOutputSchema` | | see docs |

- **Failing:** `fail(message, { errorCode?, statusCode?, details? })` raises an `ActionContractError` (400 by
  default). A bare `throw new Error()` becomes a generic 500. "Returning `{ error: "..." }` instead looks like
  success." Throw `AgentActionStopError` to end the agent's turn.
- **One action, every surface:** agent tool · `useActionQuery`/`useActionMutation` · HTTP
  `/_agent-native/actions/<name>` · CLI `pnpm action <name>` · MCP tool · A2A tool.
- **Keep the surface small:** prefer one CRUD-style `update` action with a patch; use `verb-noun` names; mark
  UI-only actions `agentTool: false`.
- Result contract: return `id`, a one-line `message`, and optionally `nextRequiredAction`.

## UI ↔ agent shared data and actions (client-data.mdx)

```ts
import { useActionQuery, useActionMutation, callAction, useDbSync, actionErrorMessage } from "@agent-native/core/client/hooks";
const { data, isLoading } = useActionQuery("list-tickets", {});           // (actionName, params, options?: UseQueryOptions) → UseQueryResult
const { mutate, isPending } = useActionMutation("send-ticket-reply");      // (actionName, options?: UseMutationOptions) → UseMutationResult; input goes to mutate()
await callAction("update-ticket", { ... });                                // (actionName, params, { method?, signal?, timeoutMs? }) → Promise<TResult>
```
- On success, a mutation "emits a change event with `source: "action"`, so every `useActionQuery()` reading
  affected data refetches automatically."
- All calls have a **60 s timeout**. `useActionQuery` retries 429/502/503/504 up to 3 times; mutations never retry.
- **Live sync:** agent tool runs invalidate the current tab's action queries automatically. Opt in with
  `useDbSync({ queryClient, realtime: { reason: "…" } })` only for changes made without the user acting
  (collaborators, inbound mail). SSE goes over `/_agent-native/events`, with `/_agent-native/poll` as fallback.

## Shared application state / context awareness (context-awareness.mdx)

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
- Keys: `navigation` (owned by the UI, written on every route change; "the agent must never write to it
  directly"), `navigate` (one-shot agent→UI command), `selection` (durable selection: store IDs, not records),
  `pending-selection-context` (one-shot highlighted text), `__url__` / `__set_url__`.
- **`view-screen` action:** "Every template should have a `view-screen` action. It reads navigation and
  selection state, fetches the relevant data, and returns a snapshot of what the user sees. This is the
  agent's eyes." The convention is to call it before acting on the current UI.
- `useNavigationState` lives in the app (`app/hooks/use-navigation-state.ts`). It writes `navigation` and
  consumes `navigate`.
- "The UI never calls an LLM directly." AI work goes to the agent via `sendToAgentChat`. Server code uses
  `agentChat.submit()` / `agentChat.prefill()`.

## Data (key-concepts.mdx, server-database.mdx)

```ts
import { table, text, integer } from "@agent-native/core/db/schema";
export const forms = table("forms", { id: text("id").primaryKey(), title: text("title").notNull(), createdAt: integer("created_at").notNull() });
```
- Local: **PGlite** (zero setup, used when `DATABASE_URL` is unset). Production: Postgres via `DATABASE_URL` (Neon, Supabase, RDS, …).
- Inspect with `pnpm action db-schema` and `pnpm action db-query --sql "SELECT …"`. By default the production agent's raw SQL is read-only (`frameworkTools: { database: "read" }`), so writes go through typed actions.

## Included features (README)

Agent chat (`<AgentPanel />`, `<AgentSidebar />`), Better Auth with orgs and RBAC, skills plus memory
(`LEARNINGS.md`, `memory/MEMORY.md`), automations and recurring jobs, agent teams (sub-agents), MCP client and
server, A2A between apps, `needsApproval` human-in-the-loop, generative UI, voice input, real-time
collaboration (Yjs). Bring-your-own chat runtimes: OpenAI Agents, OpenAI Responses, Claude Agent SDK, Vercel
AI SDK, AG-UI.

## Env vars and LLM provider (environment-variables.mdx)

**LLM: one of these is required to run the agent.** "Connect with **Use Builder.io**, add a key through
**Custom keys**, or set a provider key in `.env` for local development."

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic Claude fallback |
| `OPENAI_API_KEY` (+ optional `OPENAI_BASE_URL`) | OpenAI / OpenAI-compatible |
| `OPENROUTER_API_KEY` | OpenRouter |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini |
| `AGENT_ENGINE` | force an engine: `anthropic`, `ai-sdk:openai`, `builder`, `codex-cli` |
| `AGENT_ENGINE_PREFER_BYO_KEY` | prefer your key over the managed Builder gateway |

Choose the model in Settings. Local Ollama is also listed as an option in getting-started.

**Production deploy (deploy-an-app.mdx):** `DATABASE_URL` (required, persistent Postgres) ·
`BETTER_AUTH_SECRET` (required, ≥32 chars, stable: rotating it signs everyone out) · `BETTER_AUTH_URL`
(optional; custom domain or proxy). Others: `APP_URL`, `NITRO_PRESET`, `A2A_SECRET`, `AUTH_DISABLED`
("never use on a public production app"). Optional extras: `BRAVE_SEARCH_API_KEY`, `TAVILY_API_KEY`,
`EXA_API_KEY`, `FIRECRAWL_API_KEY`, `RESEND_API_KEY`, `SENDGRID_API_KEY`, `EMAIL_FROM`. Config health is shown
at `/_agent-native/ping?configuration=1`.

## Deploy targets (deploy-an-app.mdx, deployment.mdx)

Node.js · Docker · **Vercel** · **Netlify** · **Cloudflare Workers** (set via `NITRO_PRESET` = `node` /
`vercel` / `netlify` / `cloudflare_module`). The portability table also lists any Nitro-compatible host: Deno,
Lambda, Bun. Docs exist for aws-amplify, render, koyeb, deno-deploy and others. Steps: create → set secrets →
`pnpm migrate:production` ("Do not skip this step") → build → deploy. "Continue as local dev" works only
locally, and the local PGlite DB must not be used in production.

## Gotchas for the architect

- **Node ≥22.22 is required.** This machine has v22.17.1, so Step 2 is blocked (tollgate row C1).
- Pre-1.0 with a fast release cadence (v0.1.293 on 2026-11-06): pin the exact `@agent-native/core` version once scaffolded.
- New routes need a dev-server restart. `http.path` overrides break the hooks.
- No inline LLM calls from the UI (architecture rule 2): route AI through the agent or `sendToAgentChat`.
- The UI must never write `navigate`, and the agent must never write `navigation`.
- Serverless production syncs by polling unless the Hosted Realtime Sync Gateway is used.
- The hosted Builder.io LLM path versus your own key: a hosted-workspace runtime blocks the env-key fallback.
- The repo ships `CLAUDE.md`, `AGENTS.md`, `.claude/`, `skills/` and a `/visual-edit` Claude Code skill, which can be used during the build.

## Not captured (gaps)

`actions-run-context` (the `ctx` field table), `server-database` production details, `agent-surfaces` and
`drop-in-agent` component props, `actions-access-control`, and `needsApproval` details. These are downloaded
but only skimmed; the architect should read them at Stage 1 if they're used.
