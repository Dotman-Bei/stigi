# Stigi Foundation Implementation Plan

**Goal:** Put the pinned Agent-Native chat app at the repo root with Stigi's database plumbing, shared types, owner/caller helpers and a minimal signed-in `/board` page reachable from the nav.
**Architecture:** The chat template (`@agent-native/core@0.226.0`) is scaffolded in a temp dir and copied to the repo root beside `docs/`. App data lives in four `stigi_*` Postgres tables (PGlite locally) created by additive `runMigrations` entries in `server/plugins/db.ts`; every row is owned by `ctx.userEmail`. `/board` is a new React Router route linked from the template sidebar and set as the post-sign-in home.
**Tech Stack:** `@agent-native/core 0.226.0` (React Router 8.1.0, Nitro 3, Drizzle `^0.45.3`, Zod `^4.4.3`), TypeScript strict (base tsconfig adds `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`), Vitest `^4.1.5` with `DATABASE_URL=pglite:memory`, Node.js ≥ 22.22, pnpm 10 (template pins `pnpm@10.29.1`; pnpm self-manages it).
**Source spec:** docs/superpowers/specs/2026-11-09-stigi-design.md

**Rules for every task in the five Stigi plans:**
- Task numbers are **global** across the five plans (foundation 1–3, deploy 6–13 and 50–52, board 14–33, sort-report 34–42, ship 43–44). A `Depends on` may name a task in another plan.
- Run every command from the repo root in **Git Bash** (POSIX). Never print, echo or commit a secret; env vars are referenced by name only. Never read `.env` (it holds `OPENROUTER_API_KEY`).
- TypeScript is strict with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`: index access yields `T | undefined`; never pass `undefined` to an optional property explicitly; never `as any` (use `as unknown as T` when a cast is unavoidable).
- Server and action code imports shared code with relative paths (`../shared/...`); app code uses the `@/` and `@shared/` aliases.
- Every task that touches sample data keeps the "sample" label (`source: "sample"`, `created_by: "sample"`, UI chip, copy).
- Step "Commit" is performed by the orchestrator/kernel, never by the executor.

---

### Task 1: Scaffold the Agent-Native chat app into the repo root

**Files:**
- Create: `.agents/skills/actions/SKILL.md`
- Create: `.agents/skills/actions/references/action-fields.md`
- Create: `.agents/skills/actions/references/examples.md`
- Create: `.agents/skills/actions/references/provider-apis.md`
- Create: `.agents/skills/adding-a-feature/SKILL.md`
- Create: `.agents/skills/agent-native-docs/SKILL.md`
- Create: `.agents/skills/agent-native-toolkit/SKILL.md`
- Create: `.agents/skills/build-an-app/SKILL.md`
- Create: `.agents/skills/build-an-app/references/data-and-access.md`
- Create: `.agents/skills/build-an-app/references/edit-points-chat.md`
- Create: `.agents/skills/build-an-app/references/edit-points-default.md`
- Create: `.agents/skills/build-an-app/references/rooms-example.md`
- Create: `.agents/skills/build-an-app/references/verification.md`
- Create: `.agents/skills/client-side-routing/SKILL.md`
- Create: `.agents/skills/context-awareness/SKILL.md`
- Create: `.agents/skills/customizing-agent-native/SKILL.md`
- Create: `.agents/skills/delegate-to-agent/SKILL.md`
- Create: `.agents/skills/frontend-design/SKILL.md`
- Create: `.agents/skills/frontend-design/references/visual-direction.md`
- Create: `.agents/skills/performance/SKILL.md`
- Create: `.agents/skills/real-time-sync/SKILL.md`
- Create: `.agents/skills/reliable-mutations/SKILL.md`
- Create: `.agents/skills/secrets/SKILL.md`
- Create: `.agents/skills/security/SKILL.md`
- Create: `.agents/skills/shadcn-ui/SKILL.md`
- Create: `.agents/skills/sharing/SKILL.md`
- Create: `.agents/skills/storing-data/SKILL.md`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `.ignore`
- Create: `.mcp.json`
- Create: `.oxfmtrc.json`
- Create: `AGENTS.md`
- Create: `CHANGELOG.md`
- Create: `DESIGN.md`
- Create: `DEVELOPING.md`
- Create: `actions/hello.ts`
- Create: `actions/navigate.ts`
- Create: `actions/provider-api-request.ts`
- Create: `actions/run.ts`
- Create: `actions/view-screen.ts`
- Create: `agent-native.config.ts`
- Create: `agent-native.json`
- Create: `app/components/ChatComposerContext.tsx`
- Create: `app/components/chat/ChatHomeRedirect.tsx`
- Create: `app/components/chat/ChatRouteContent.tsx`
- Create: `app/components/home/HomePage.tsx`
- Create: `app/components/layout/AgentInspector.tsx`
- Create: `app/components/layout/Header.tsx`
- Create: `app/components/layout/Layout.tsx`
- Create: `app/components/layout/MobileAppBar.tsx`
- Create: `app/components/layout/Sidebar.tsx`
- Create: `app/components/ui/button.tsx`
- Create: `app/components/ui/card.tsx`
- Create: `app/components/ui/dropdown-menu.tsx`
- Create: `app/components/ui/hover-card.tsx`
- Create: `app/components/ui/input.tsx`
- Create: `app/components/ui/item.tsx`
- Create: `app/components/ui/label.tsx`
- Create: `app/components/ui/separator.tsx`
- Create: `app/components/ui/sheet.tsx`
- Create: `app/components/ui/skeleton.tsx`
- Create: `app/components/ui/toolkit-provider.tsx`
- Create: `app/components/ui/tooltip.tsx`
- Create: `app/design-system.ts`
- Create: `app/entry.client.tsx`
- Create: `app/entry.server.tsx`
- Create: `app/global.css`
- Create: `app/hooks/use-navigation-state.ts`
- Create: `app/i18n/ar-SA.ts`
- Create: `app/i18n/de-DE.ts`
- Create: `app/i18n/en-US.ts`
- Create: `app/i18n/es-ES.ts`
- Create: `app/i18n/fr-FR.ts`
- Create: `app/i18n/hi-IN.ts`
- Create: `app/i18n/index.ts`
- Create: `app/i18n/ja-JP.ts`
- Create: `app/i18n/ko-KR.ts`
- Create: `app/i18n/pt-BR.ts`
- Create: `app/i18n/zh-CN.ts`
- Create: `app/i18n/zh-TW.ts`
- Create: `app/lib/app-config.ts`
- Create: `app/lib/chat-home-thread.ts`
- Create: `app/lib/chat-paths.ts`
- Create: `app/lib/tab-id.ts`
- Create: `app/lib/utils.ts`
- Create: `app/root.tsx`
- Create: `app/routes.ts`
- Create: `app/routes/_index.tsx`
- Create: `app/routes/agent.tsx`
- Create: `app/routes/chat.$threadId.tsx`
- Create: `app/routes/chat._index.tsx`
- Create: `app/routes/database.tsx`
- Create: `app/routes/extensions.$id.$slug.tsx`
- Create: `app/routes/extensions.$id.tsx`
- Create: `app/routes/extensions._index.tsx`
- Create: `app/routes/extensions.tsx`
- Create: `app/routes/home.tsx`
- Create: `app/routes/observability.tsx`
- Create: `app/routes/settings.$.tsx`
- Create: `app/routes/settings.tsx`
- Create: `app/routes/team.tsx`
- Create: `app/vite-env.d.ts`
- Create: `changelog/2026-08-27-chat-includes-provider-runtimes-after-deployment.md`
- Create: `changelog/2026-09-27-chat-missing-provider-retry.md`
- Create: `changelog/2026-09-30-compact-composer-context-menus.md`
- Create: `changelog/2026-10-10-home-handoff-recovery-capacity.md`
- Create: `components.json`
- Create: `learnings.defaults.md`
- Create: `netlify.toml`
- Create: `package.json`
- Create: `pnpm-lock.yaml`
- Create: `pnpm-workspace.yaml`
- Create: `public/agent-native-icon-dark.svg`
- Create: `public/agent-native-icon-light.svg`
- Create: `public/agent-native-logo-dark.svg`
- Create: `public/agent-native-logo-light.svg`
- Create: `public/favicon.svg`
- Create: `public/icon-180.svg`
- Create: `public/icon-192.svg`
- Create: `public/icon-512.svg`
- Create: `public/manifest.json`
- Create: `react-router.config.ts`
- Create: `scripts/migrate-production.ts`
- Create: `server/lib/composer-reference-messages.ts`
- Create: `server/lib/composer-references.ts`
- Create: `server/middleware/auth.ts`
- Create: `server/plugins/agent-chat.ts`
- Create: `server/plugins/agent-native-email-branding.ts`
- Create: `server/plugins/auth.ts`
- Create: `server/plugins/otel.ts`
- Create: `server/routes/[...page].get.ts`
- Create: `server/routes/index.get.ts`
- Create: `ssr-entry.ts`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`

**Effort:** low
**Model tier:** fast
**Provides:** `@agent-native/core 0.226.0 chat-template app at repo root`

- [ ] **Step 1: Check the toolchain**
      Run: `node --version && pnpm --version`
      Expected: `v22.23.4` (any ≥ v22.22.0) and `10.x`

- [ ] **Step 2: Scaffold in a temp dir and copy it to the repo root**
      The repo root already holds `docs/`, `.claude/settings.local.json` and a stub `README.md`; keep all three. The scaffold's own `.git`, `node_modules`, `.claude`, `README.md`, `CLAUDE.md` (a symlink) and `learnings.md` are not copied.
      ```bash
      export DO_NOT_TRACK=1 AGENT_NATIVE_TELEMETRY_DISABLED=1
      SCAFFOLD_DIR="$(mktemp -d)"
      ( cd "$SCAFFOLD_DIR" && npx --yes @agent-native/core@0.226.0 create stigi --standalone --template chat < /dev/null )
      rm -rf "$SCAFFOLD_DIR/stigi/.git" "$SCAFFOLD_DIR/stigi/node_modules" "$SCAFFOLD_DIR/stigi/.claude" \
             "$SCAFFOLD_DIR/stigi/README.md" "$SCAFFOLD_DIR/stigi/CLAUDE.md" "$SCAFFOLD_DIR/stigi/learnings.md"
      cp -R "$SCAFFOLD_DIR/stigi/." .
      rm -rf "$SCAFFOLD_DIR"
      ```
      If `npx` fails with peer-dependency errors, run `npx clear-npx-cache` and repeat this step.

- [ ] **Step 3: Install dependencies**
      Run: `pnpm install`
      Expected: ends with `Done in …` (pnpm switches itself to v10.29.1 from `packageManager`). "Ignored build scripts" warnings are expected.

- [ ] **Step 4: Confirm the exact framework pin**
      Run: `node -e "const p=require('./package.json');if(p.dependencies['@agent-native/core']!=='0.226.0'){console.error(p.dependencies['@agent-native/core']);process.exit(1)}console.log('PIN_OK')"`
      Expected: `PIN_OK`

- [ ] **Step 5: Typecheck the untouched scaffold (the gate)**
      Run: `pnpm typecheck && echo TYPECHECK_OK`
      Expected: `TYPECHECK_OK` (about 55 s; it also generates `.generated/`, which is git-ignored)

- [ ] **Step 6: Commit (kernel-performed — no agent runs this)**
      Message: `chore: scaffold Stigi from the Agent-Native chat template (core 0.226.0)`

---

### Task 2: Database plumbing, shared types, owner and caller helpers

**Files:**
- Create: `server/db/schema.ts`
- Create: `server/db/migrations.ts`
- Create: `server/db/index.ts`
- Create: `server/db/test-db.ts`
- Create: `server/plugins/db.ts`
- Create: `shared/board-types.ts`
- Create: `server/lib/owner.ts`
- Create: `server/lib/caller.ts`
- Modify: `.env.example`
- Modify: `vitest.config.ts`
- Test: `server/db/schema.test.ts`
- Test: `server/lib/owner.test.ts`

**Depends on:** Task 1
**Effort:** medium
**Provides:** `getDb(): PgDatabase (typed with schema)`, `schema.stigiClusters`, `schema.stigiNotes`, `schema.stigiReports`, `schema.stigiAgentTurns`, `STIGI_MIGRATIONS: MigrationEntry[]`, `resetTestDb(): Promise<void>`, `requireOwner(ctx: OwnerContext | undefined): string`, `actorFromCtx(ctx: CallerContext | undefined): Actor`, `type BoardNote`, `type BoardCluster`, `type BoardSnapshot`, `type AgentUsage`, `type Actor = "user" | "agent"`, `type ClusterOrigin = "user" | "agent" | "sample"`
**Requires:** `@agent-native/core 0.226.0 chat-template app at repo root`

- [ ] **Step 1: Exclude Playwright specs from Vitest**
      Replace the whole of `vitest.config.ts` with:
      ```ts
      import path from "node:path";

      import { defineConfig } from "vitest/config";

      export default defineConfig({
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "./app"),
            "@shared": path.resolve(__dirname, "./shared"),
          },
        },
        test: {
          env: { DATABASE_URL: "pglite:memory" },
          exclude: [
            "**/node_modules/**",
            "**/.git/**",
            "**/dist/**",
            "**/.react-router/**",
            "**/e2e/**",
          ],
        },
      });
      ```

- [ ] **Step 2: Write the failing tests**
      Create `server/db/schema.test.ts`:
      ```ts
      import { eq } from "drizzle-orm";
      import { beforeEach, describe, expect, it } from "vitest";

      import { getDb, schema } from "./index.js";
      import { STIGI_MIGRATIONS } from "./migrations.js";
      import { resetTestDb } from "./test-db.js";

      const OWNER = "ada@stigi.test";

      describe("stigi schema", () => {
        beforeEach(async () => {
          await resetTestDb();
        });

        it("has six additive, uniquely versioned single-statement migrations", () => {
          expect(STIGI_MIGRATIONS.map((m) => m.version)).toEqual([1, 2, 3, 4, 5, 6]);
          for (const m of STIGI_MIGRATIONS) {
            expect(typeof m.sql).toBe("string");
            expect(String(m.sql).startsWith("CREATE")).toBe(true);
            expect(String(m.sql).includes(";")).toBe(false);
          }
        });

        it("round-trips a sample cluster and a sample note through drizzle", async () => {
          const db = getDb();
          const now = new Date().toISOString();
          await db.insert(schema.stigiClusters).values({
            id: "c1", ownerEmail: OWNER, name: "Mobile app", createdBy: "sample",
            position: 0, createdAt: now, updatedAt: now,
          });
          await db.insert(schema.stigiNotes).values({
            id: "n1", ownerEmail: OWNER, body: "hello", source: "sample", clusterId: "c1",
            reason: null, movedBy: null, movedAt: null, position: 0, createdAt: now,
          });
          const rows = await db.select().from(schema.stigiNotes).where(eq(schema.stigiNotes.clusterId, "c1"));
          expect(rows).toHaveLength(1);
          expect(rows[0]?.source).toBe("sample");
        });

        it("rejects an unknown created_by value", async () => {
          const now = new Date().toISOString();
          await expect(
            getDb().insert(schema.stigiClusters).values({
              id: "c2", ownerEmail: OWNER, name: "x", createdBy: "robot" as unknown as "user",
              position: 0, createdAt: now, updatedAt: now,
            }),
          ).rejects.toThrow();
        });

        it("keeps one agent-turn row per owner and day", async () => {
          const db = getDb();
          await db.insert(schema.stigiAgentTurns).values({ ownerEmail: OWNER, day: "2026-11-09", count: 1 });
          await expect(
            db.insert(schema.stigiAgentTurns).values({ ownerEmail: OWNER, day: "2026-11-09", count: 1 }),
          ).rejects.toThrow();
        });
      });
      ```
      Create `server/lib/owner.test.ts`:
      ```ts
      import { describe, expect, it } from "vitest";

      import { actorFromCtx } from "./caller.js";
      import { requireOwner } from "./owner.js";

      describe("requireOwner", () => {
        it("returns the trimmed signed-in email", () => {
          expect(requireOwner({ userEmail: " ada@stigi.test " })).toBe("ada@stigi.test");
        });

        it("fails when nobody is signed in", () => {
          expect(() => requireOwner(undefined)).toThrow(/Sign in to use Stigi/);
          expect(() => requireOwner({ userEmail: "" })).toThrow(/Sign in to use Stigi/);
        });
      });

      describe("actorFromCtx", () => {
        it("maps the agent tool caller to agent and every other caller to user", () => {
          expect(actorFromCtx({ caller: "tool" })).toBe("agent");
          expect(actorFromCtx({ caller: "frontend" })).toBe("user");
          expect(actorFromCtx({ caller: "cli" })).toBe("user");
          expect(actorFromCtx(undefined)).toBe("user");
        });
      });
      ```

- [ ] **Step 3: Run to confirm they fail**
      Run: `pnpm vitest run server/db/schema.test.ts server/lib/owner.test.ts`
      Expected: FAIL — `Failed to resolve import "./index.js"` / `"./caller.js"`

- [ ] **Step 4: Write the shared types**
      Create `shared/board-types.ts`:
      ```ts
      export type Actor = "user" | "agent";
      export type ClusterOrigin = "user" | "agent" | "sample";
      export type NoteSource = "sample" | "import";

      export interface BoardNote {
        id: string;
        body: string;
        source: NoteSource;
        clusterId: string | null;
        reason: string | null;
        movedBy: Actor | null;
        movedAt: string | null;
        position: number;
      }

      export interface BoardCluster {
        id: string;
        name: string | null;
        createdBy: ClusterOrigin;
        position: number;
        notes: BoardNote[];
      }

      export interface BoardSnapshot {
        clusters: BoardCluster[];
        unsorted: BoardNote[];
        totalNotes: number;
        sampleNotes: number;
      }

      export interface AgentUsage {
        used: number;
        limit: number;
        remaining: number;
        resetsAt: string;
      }

      export const MAX_BOARD_NOTES = 500;
      export const MAX_MOVES_PER_CALL = 50;
      export const MAX_REASON_CHARS = 140;
      export const MAX_CLUSTER_NAME_CHARS = 60;
      export const UNTITLED_LABEL = "Untitled";
      ```

- [ ] **Step 5: Write the schema, migrations, db client, test helper and migration plugin**
      Create `server/db/schema.ts`:
      ```ts
      import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

      export const stigiClusters = pgTable("stigi_clusters", {
        id: text("id").primaryKey(),
        ownerEmail: text("owner_email").notNull(),
        name: text("name"),
        createdBy: text("created_by", { enum: ["user", "agent", "sample"] }).notNull(),
        position: integer("position").notNull().default(0),
        createdAt: text("created_at").notNull(),
        updatedAt: text("updated_at").notNull(),
      });

      export const stigiNotes = pgTable("stigi_notes", {
        id: text("id").primaryKey(),
        ownerEmail: text("owner_email").notNull(),
        body: text("body").notNull(),
        source: text("source", { enum: ["sample", "import"] }).notNull(),
        clusterId: text("cluster_id"),
        reason: text("reason"),
        movedBy: text("moved_by", { enum: ["user", "agent"] }),
        movedAt: text("moved_at"),
        position: integer("position").notNull().default(0),
        createdAt: text("created_at").notNull(),
      });

      export const stigiReports = pgTable("stigi_reports", {
        ownerEmail: text("owner_email").primaryKey(),
        markdown: text("markdown").notNull(),
        updatedBy: text("updated_by", { enum: ["user", "agent"] }).notNull(),
        updatedAt: text("updated_at").notNull(),
      });

      export const stigiAgentTurns = pgTable(
        "stigi_agent_turns",
        {
          ownerEmail: text("owner_email").notNull(),
          day: text("day").notNull(),
          count: integer("count").notNull().default(0),
        },
        (t) => [primaryKey({ columns: [t.ownerEmail, t.day] })],
      );
      ```
      Create `server/db/migrations.ts` (one statement per entry — the Neon serverless driver rejects multi-statement strings; never edit or renumber an entry once applied, only append):
      ```ts
      import type { MigrationEntry } from "@agent-native/core/db";

      export const STIGI_MIGRATIONS_TABLE = "stigi_migrations";

      export const STIGI_MIGRATIONS: MigrationEntry[] = [
        {
          version: 1,
          name: "create_stigi_clusters",
          sql: `CREATE TABLE IF NOT EXISTS stigi_clusters (
        id TEXT PRIMARY KEY,
        owner_email TEXT NOT NULL,
        name TEXT,
        created_by TEXT NOT NULL CHECK (created_by IN ('user','agent','sample')),
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
        },
        {
          version: 2,
          name: "index_stigi_clusters_owner",
          sql: `CREATE INDEX IF NOT EXISTS stigi_clusters_owner_idx ON stigi_clusters (owner_email)`,
        },
        {
          version: 3,
          name: "create_stigi_notes",
          sql: `CREATE TABLE IF NOT EXISTS stigi_notes (
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
      )`,
        },
        {
          version: 4,
          name: "index_stigi_notes_owner_cluster",
          sql: `CREATE INDEX IF NOT EXISTS stigi_notes_owner_cluster_idx ON stigi_notes (owner_email, cluster_id)`,
        },
        {
          version: 5,
          name: "create_stigi_reports",
          sql: `CREATE TABLE IF NOT EXISTS stigi_reports (
        owner_email TEXT PRIMARY KEY,
        markdown TEXT NOT NULL,
        updated_by TEXT NOT NULL CHECK (updated_by IN ('user','agent')),
        updated_at TEXT NOT NULL
      )`,
        },
        {
          version: 6,
          name: "create_stigi_agent_turns",
          sql: `CREATE TABLE IF NOT EXISTS stigi_agent_turns (
        owner_email TEXT NOT NULL,
        day TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (owner_email, day)
      )`,
        },
      ];
      ```
      Create `server/db/index.ts`:
      ```ts
      import { createGetDb } from "@agent-native/core/db";

      import * as schema from "./schema.js";

      export const getDb = createGetDb(schema);
      export { schema };
      ```
      Create `server/db/test-db.ts` (used only by tests; applies the same migrations to in-memory PGlite and clears the tables):
      ```ts
      import { getDbExec } from "@agent-native/core/db";

      import { STIGI_MIGRATIONS } from "./migrations.js";

      export async function resetTestDb(): Promise<void> {
        const exec = getDbExec();
        for (const migration of STIGI_MIGRATIONS) {
          const statement = typeof migration.sql === "string" ? migration.sql : migration.sql.postgres;
          if (statement) await exec.execute(statement);
        }
        await exec.execute("DELETE FROM stigi_notes");
        await exec.execute("DELETE FROM stigi_clusters");
        await exec.execute("DELETE FROM stigi_reports");
        await exec.execute("DELETE FROM stigi_agent_turns");
      }
      ```
      Create `server/plugins/db.ts` (Nitro plugin for dev startup; `pnpm migrate:production` imports this same file):
      ```ts
      import { runMigrations } from "@agent-native/core/db";

      import { STIGI_MIGRATIONS, STIGI_MIGRATIONS_TABLE } from "../db/migrations.js";

      export default runMigrations(STIGI_MIGRATIONS, { table: STIGI_MIGRATIONS_TABLE });
      ```

- [ ] **Step 6: Write the owner and caller helpers**
      Create `server/lib/owner.ts`:
      ```ts
      import { fail } from "@agent-native/core/action";

      export interface OwnerContext {
        userEmail?: string | undefined;
      }

      /** The signed-in user's email; every stigi_* row is scoped to it. */
      export function requireOwner(ctx: OwnerContext | undefined): string {
        const email = ctx?.userEmail?.trim();
        if (!email) {
          fail("Sign in to use Stigi.", { errorCode: "unauthenticated", statusCode: 401 });
        }
        return email;
      }
      ```
      Create `server/lib/caller.ts`:
      ```ts
      import type { Actor } from "../../shared/board-types.js";

      export interface CallerContext {
        caller?: string | undefined;
      }

      /** The agent calls actions as a tool; every other surface (UI, CLI, HTTP) is the user. */
      export function actorFromCtx(ctx: CallerContext | undefined): Actor {
        return ctx?.caller === "tool" ? "agent" : "user";
      }
      ```

- [ ] **Step 7: Document the non-secret agent settings**
      Append to the end of `.env.example`:
      ```bash

      # --- Stigi agent (OpenRouter) ---------------------------------------------
      # The key goes ONLY in your git-ignored .env and in Vercel's production env.
      # OPENROUTER_API_KEY=
      AGENT_ENGINE=ai-sdk:openrouter
      AGENT_MODEL=anthropic/claude-sonnet-5.5
      # Documented fallback if a 35 s turn-budget gate misses twice: AGENT_MODEL=anthropic/claude-haiku-5.5
      AGENT_ENGINE_PREFER_BYO_KEY=1
      # Per-user daily cap on agent turns (public demo protection)
      STIGI_DAILY_AGENT_TURNS=40
      # Production only, set temporarily by the deploy skeleton's probe step, then removed:
      # STIGI_ENABLE_PROBE=1
      ```

- [ ] **Step 8: Run to confirm they pass (the gate)**
      Run: `pnpm vitest run server/db/schema.test.ts server/lib/owner.test.ts`
      Expected: PASS — `Test Files  2 passed (2)`

- [ ] **Step 9: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add stigi database schema, migrations and owner/caller helpers`

---

### Task 3: Board shell route, nav link, home path and navigation views

**Files:**
- Create: `app/routes/board.tsx`
- Modify: `app/hooks/use-navigation-state.ts`
- Modify: `app/components/layout/Sidebar.tsx`
- Modify: `server/plugins/agent-native-email-branding.ts`
- Test: `app/hooks/use-navigation-state.test.ts`

**Depends on:** Task 1
**Effort:** medium
**Provides:** `/board route shell with h1 "Feedback board"`, `navigation views: /board -> "board", /board/report -> "report"`, `pathForCommand({ view: "report" }) -> "/board/report"`
**Requires:** `@agent-native/core 0.226.0 chat-template app at repo root`

UI task: follows `docs/design/frontend.md` (the shell is replaced by the styled board in Task 31; this task only establishes the route, nav entry and navigation state the agent reads).

- [ ] **Step 1: Write the failing test**
      Create `app/hooks/use-navigation-state.test.ts`:
      ```ts
      // @vitest-environment happy-dom
      import { describe, expect, it } from "vitest";

      import { navigationStateForPath, pathForCommand } from "./use-navigation-state";

      describe("Stigi navigation views", () => {
        it("maps the board routes to the board and report views", () => {
          expect(navigationStateForPath("/board").view).toBe("board");
          expect(navigationStateForPath("/board/report").view).toBe("report");
        });

        it("maps agent navigate commands to the board routes", () => {
          expect(pathForCommand({ view: "board" })).toBe("/board");
          expect(pathForCommand({ view: "report" })).toBe("/board/report");
        });

        it("keeps the template's home view", () => {
          expect(navigationStateForPath("/home").view).toBe("home");
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run app/hooks/use-navigation-state.test.ts`
      Expected: FAIL — `expected 'chat' to be 'board'`

- [ ] **Step 3: Add the board views to the navigation hook**
      In `app/hooks/use-navigation-state.ts`, change the start of `viewForPath` from:
      ```ts
      function viewForPath(pathname: string): string {
        if (isChatPathname(pathname)) return "chat";
      ```
      to:
      ```ts
      function viewForPath(pathname: string): string {
        if (pathname === "/board/report" || pathname.startsWith("/board/report/")) return "report";
        if (pathname === "/board" || pathname.startsWith("/board/")) return "board";
        if (isChatPathname(pathname)) return "chat";
      ```
      and in `pathForView`, change:
      ```ts
        switch (view) {
          case "chat":
      ```
      to:
      ```ts
        switch (view) {
          case "board":
            return "/board";
          case "report":
            return "/board/report";
          case "chat":
      ```

- [ ] **Step 4: Create the board shell route**
      Create `app/routes/board.tsx`:
      ```tsx
      export function meta() {
        return [{ title: "Feedback board · Stigi" }];
      }

      export default function BoardRoute() {
        return (
          <div data-testid="board-shell" style={{ padding: 24 }}>
            <h1>Feedback board</h1>
            <p>Your Stigi board is ready. Notes and themes appear here.</p>
          </div>
        );
      }
      ```

- [ ] **Step 5: Add the Board link to the sidebar**
      In `app/components/layout/Sidebar.tsx`, add `IconLayoutKanban` to the existing `@tabler/icons-react` import list (keep alphabetical order):
      ```ts
      import {
        IconEdit,
        IconHome,
        IconLayoutKanban,
        IconLayoutSidebarLeftCollapse,
        IconLayoutSidebarLeftExpand,
        IconLoader2,
        IconSearch,
      } from "@tabler/icons-react";
      ```
      Add this component directly above `function HomeNavLink(`:
      ```tsx
      function BoardNavLink({ collapsed }: { collapsed: boolean }) {
        const location = useLocation();
        const active = location.pathname === "/board" || location.pathname.startsWith("/board/");
        const link = (
          <Link
            to="/board"
            aria-current={active ? "page" : undefined}
            aria-label={collapsed ? "Feedback board" : undefined}
            className={cn(
              "flex items-center text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              active && "bg-sidebar-accent",
              collapsed
                ? "size-8 justify-center rounded-md"
                : "h-8 w-full gap-3 rounded-lg px-3 text-sm font-medium",
            )}
          >
            <IconLayoutKanban className="size-4 shrink-0" strokeWidth={1.8} />
            <span className={collapsed ? "sr-only" : "truncate"}>Feedback board</span>
          </Link>
        );

        if (collapsed) {
          return (
            <Tooltip>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">Feedback board</TooltipContent>
            </Tooltip>
          );
        }

        return <div className="px-2">{link}</div>;
      }
      ```
      In the `<nav …>` block, change:
      ```tsx
              <HomeNavLink collapsed={collapsed} />
              <ChatThreadsSection collapsed={collapsed} />
      ```
      to:
      ```tsx
              <BoardNavLink collapsed={collapsed} />
              <HomeNavLink collapsed={collapsed} />
              <ChatThreadsSection collapsed={collapsed} />
      ```

- [ ] **Step 6: Make /board the post-sign-in home**
      In `server/plugins/agent-native-email-branding.ts`, change `homePath: "/home",` to `homePath: "/board",`.

- [ ] **Step 7: Run to confirm it passes and the app typechecks (the gate)**
      Run: `pnpm vitest run app/hooks/use-navigation-state.test.ts && pnpm typecheck && echo SHELL_OK`
      Expected: PASS — `Test Files  1 passed (1)` then `SHELL_OK`

- [ ] **Step 8: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add the /board shell route, sidebar link and board navigation views`
