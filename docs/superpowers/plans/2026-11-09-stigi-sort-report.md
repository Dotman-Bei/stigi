# Stigi Sort + Report Implementation Plan

**Goal:** Give the agent a visible sorting job (batched "Sort with agent" loop) and finish the useful outcome: merge/delete/reset, CSV import, and an editable insight report the agent writes and the user exports as Markdown.
**Architecture:** "Sort with agent" is a client-side loop in `BoardPage`: each agent turn sorts ONE batch of ≤ 25 unsorted notes (fits one 40 s hosted chunk), and the UI sends the next batch when the turn ends. Report data comes from a deterministic `get-board-digest` action; the agent saves Markdown with `save-report` and opens `/board/report` with `navigate`; the user edits in the same pane and exports a `.md` file client-side. All new capabilities are shared actions (UI + agent) with tests.
**Tech Stack:** `@agent-native/core 0.226.0`, React 19.3, React Router 8.1.0, Drizzle `^0.45.3`, Zod `^4.4.3`, Vitest `^4.1.5` + happy-dom + `@testing-library/react 16.3.3`, `@playwright/test 1.65.0`, sonner.
**Source spec:** docs/superpowers/specs/2026-11-09-stigi-design.md

**Rules for every task in the five Stigi plans:**
- Task numbers are **global** across the five plans (foundation 1–3, deploy 6–13 and 50–52, board 14–33, sort-report 34–42, ship 43–44). A `Depends on` may name a task in another plan.
- Run every command from the repo root in **Git Bash** (POSIX). Never print, echo or commit a secret. Never read `.env`.
- TypeScript is strict with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`; never `as any`.
- Server and action code imports shared code with relative paths; app code uses `@/` and `@shared/`.
- Every task that touches sample data keeps the "sample" label (the report's source line says "sample data" when sample notes exist).
- Action tests call `action.run(args, ctx)` directly (pass every field) with `ctx = { userEmail, caller: "frontend" }` (user) or `caller: "tool"` (agent), against in-memory PGlite reset by `resetTestDb()`.
- UI tasks follow `docs/design/frontend.md` (tokens, type, radius, motion, one button/card system; kit at `docs/design/frontend-kit/`).
- `app/components/board/BoardPage.tsx` is edited by Tasks 35 → 38 → 40 → 41 in that order (each depends on the previous) so the exact-text edits below always apply.
- **Timing flake rule (spec D17):** `sort-batch.spec.ts` has one built-in retry; two misses of 35 s → set `AGENT_MODEL=anthropic/claude-haiku-5.5` in `.env` and re-run; never rewrite the flow, the batch size or the budget.
- Step "Commit" is performed by the orchestrator/kernel, never by the executor.
- **Cut order if the build runs behind (spec D12):** stretch → merge/delete polish (Tasks 37–38) → CSV edge cases (Task 41). Never cut the report (Tasks 39, 40, 42), the sort loop (34–36) or tests. A cut is a plan edit made by the architect seat (one-task plan-bug fix), never an executor improvisation, because downstream tasks name these tasks. **Cut procedure — drop 37–38:** remove Tasks 37/38 from every `Depends on` (Tasks 39, 40, 44 and deploy Task 51) and their Provides strings from those tasks' `Requires`; in Task 39 delete the `"merge-clusters",` line from Step 4 and depend on Tasks 2, 16, 17, 24; make Task 40 depend on Task 35 instead of Task 38 (Task 41's edit anchors do not use Task 38 code, so it needs no change). **Drop 41:** remove Task 41 from the `Depends on` of Tasks 42, 44 and deploy Task 51 and its Provides string from their `Requires`. Regenerate and re-validate the manifest after any cut.

**Upstream signatures used throughout:**
```ts
// shared/board-types.ts (Task 2)
export type Actor = "user" | "agent";
export interface BoardNote { id: string; body: string; source: "sample" | "import"; clusterId: string | null; reason: string | null; movedBy: Actor | null; movedAt: string | null; position: number }
export interface BoardCluster { id: string; name: string | null; createdBy: "user" | "agent" | "sample"; position: number; notes: BoardNote[] }
export interface BoardSnapshot { clusters: BoardCluster[]; unsorted: BoardNote[]; totalNotes: number; sampleNotes: number }
export const UNTITLED_LABEL = "Untitled";
// server/db/index.ts: getDb(), schema.{stigiClusters, stigiNotes, stigiReports, stigiAgentTurns}
//   stigiReports columns: { ownerEmail (PK), markdown, updatedBy: "user" | "agent", updatedAt }
// server/db/test-db.ts: resetTestDb(): Promise<void>
// server/lib/owner.ts: requireOwner(ctx): string · server/lib/caller.ts: actorFromCtx(ctx): Actor
// server/lib/board-store.ts (Task 16): loadBoard(ownerEmail): Promise<BoardSnapshot>; getOwnedCluster(ownerEmail, clusterId): Promise<ClusterRow>;
//   nextNotePosition(ownerEmail, clusterId: string | null): Promise<number>; clipText(text, max): string
// shared/agent-limits.ts (Task 23): dailyLimitMessage(limit: number): string
// app/lib/board/handoff.ts (Task 27): interface Handoff { message: string; context: string }; buildSortHandoff(): Handoff; buildReportHandoff(): Handoff; SORT_BATCH_SIZE = 25
```

---

### Task 34: `sort-feedback` and `write-report` skills

**Files:**
- Create: `.agents/skills/sort-feedback/SKILL.md`
- Create: `.agents/skills/write-report/SKILL.md`
- Test: `server/lib/agent-skills.test.ts`

**Depends on:** Task 25
**Effort:** medium
**Provides:** `.agents/skills/sort-feedback/SKILL.md`, `.agents/skills/write-report/SKILL.md`
**Requires:** `AGENTS.md Stigi section`

- [ ] **Step 1: Write the failing test**
      Create `server/lib/agent-skills.test.ts`:
      ```ts
      import { readFileSync } from "node:fs";

      import { describe, expect, it } from "vitest";

      describe("sort and report skills", () => {
        it("sort-feedback processes one batch of at most 25 with one move-notes call", () => {
          const skill = readFileSync(".agents/skills/sort-feedback/SKILL.md", "utf8");
          expect(skill.startsWith("---\nname: sort-feedback\n")).toBe(true);
          expect(skill).toContain('scope: "unsorted", limit: 25');
          expect(skill).toContain("view-screen");
          expect(skill).toContain("ONCE");
          expect(skill).toContain("Then stop");
        });

        it("write-report uses the digest, keeps the sample label and opens the report", () => {
          const skill = readFileSync(".agents/skills/write-report/SKILL.md", "utf8");
          expect(skill.startsWith("---\nname: write-report\n")).toBe(true);
          expect(skill).toContain("get-board-digest");
          expect(skill).toContain("save-report");
          expect(skill).toContain('navigate` with `{ view: "report" }');
          expect(skill).toContain("sample data");
          expect(skill).toContain("verbatim");
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run server/lib/agent-skills.test.ts`
      Expected: FAIL — `ENOENT: no such file or directory, open '.agents/skills/sort-feedback/SKILL.md'`

- [ ] **Step 3: Write the two skills**
      Create `.agents/skills/sort-feedback/SKILL.md`:
      ```markdown
      ---
      name: sort-feedback
      description: Use when asked to sort unsorted notes — file ONE batch of at most 25 unsorted notes into themes, each move with a one-line reason, then stop. The app sends the next batch itself.
      ---

      # Sort feedback (one batch)

      1. Call `view-screen` to get the current cluster ids and names.
      2. Call `list-notes` with `{ scope: "unsorted", limit: 25, offset: 0 }`.
      3. For each note pick the best existing cluster (reuse it by id). If several notes share a theme no
         cluster covers, call `create-cluster` with `{ name }` (2–4 words) — at most 3 new clusters per
         batch and at most 8 themes on the board.
      4. Call `move-notes` ONCE with every note in the batch: `{ moves: [{ noteId, clusterId, reason }] }`.
         Each reason is one line (aim for 80 characters or fewer) naming why the note belongs there.
      5. Reply with one line: `Sorted <n> notes; <m> unsorted remain.` Then stop.

      Rules: one batch per turn; never more than 25 notes; never more than one `move-notes` call; never
      invent notes; sample notes are synthetic sample data — call them that.
      ```
      Create `.agents/skills/write-report/SKILL.md`:
      ````markdown
      ---
      name: write-report
      description: Use when asked to write the insight report — build it from get-board-digest, save it with save-report, and open the report pane.
      ---

      # Write the insight report

      1. Call `get-board-digest`.
      2. Write Markdown in exactly this shape (largest theme first, one numbered entry per theme):

         ```
         # Customer feedback insights — <today, YYYY-MM-DD>
         _<totalNotes> comments<if sampleNotes > 0: "; sample data">_

         ## Top themes
         1. **<name>** — <noteCount> comments (<share>%)
            > "<quote 1>"
            > "<quote 2>"
            Suggested next step: <one concrete sentence>

         ## Not yet sorted
         <unsortedCount> comments are not in a theme yet.
         ```

      3. Call `save-report` with `{ markdown }`.
      4. Call `navigate` with `{ view: "report" }`.
      5. Reply with one line, then stop.

      Rules: quotes are copied verbatim from the digest (2–3 per theme); never invent counts or quotes;
      keep "sample data" in the source line whenever sample notes exist.
      ````

- [ ] **Step 4: Run to confirm it passes (the gate)**
      Run: `pnpm vitest run server/lib/agent-skills.test.ts`
      Expected: PASS — `Tests  2 passed (2)`

- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add the sort-feedback and write-report agent skills`

---

### Task 35: "Sort with agent" loop

**Files:**
- Create: `app/lib/board/sort-loop.ts`
- Modify: `app/components/board/BoardPage.tsx`
- Test: `app/lib/board/sort-loop.test.ts`

**Depends on:** Task 27, Task 31, Task 34
**Effort:** medium
**Provides:** `nextSortStep(state: SortLoopState): SortLoopStep`, `BoardPage "Sort with agent" / "Stop sorting" loop (one batch per turn)`
**Requires:** `<BoardPage /> (data-agent-state, 2 s polling while the agent runs, DnD, glide-in, selection app-state, auto-teach)`, `buildSortHandoff(): Handoff`, `.agents/skills/sort-feedback/SKILL.md`

UI task: applies `docs/design/frontend.md` (the top bar's one primary button toggles between "Sort with agent" and "Stop sorting"; errors and stops are announced with toasts, never silently).

- [ ] **Step 1: Write the failing test**
      Create `app/lib/board/sort-loop.test.ts`:
      ```ts
      import { describe, expect, it } from "vitest";

      import { nextSortStep, type SortLoopState } from "./sort-loop";

      const base: SortLoopState = { active: true, generating: false, unsortedCount: 50, remainingTurns: 10, lastUnsortedCount: null };

      describe("nextSortStep", () => {
        it("waits while inactive or while a turn runs", () => {
          expect(nextSortStep({ ...base, active: false })).toBe("wait");
          expect(nextSortStep({ ...base, generating: true })).toBe("wait");
        });

        it("sends the first batch and the next one after progress", () => {
          expect(nextSortStep(base)).toBe("send");
          expect(nextSortStep({ ...base, unsortedCount: 25, lastUnsortedCount: 50 })).toBe("send");
        });

        it("stops when done, when a turn made no progress, or when credits run out", () => {
          expect(nextSortStep({ ...base, unsortedCount: 0, lastUnsortedCount: 25 })).toBe("stop-done");
          expect(nextSortStep({ ...base, unsortedCount: 25, lastUnsortedCount: 25 })).toBe("stop-no-progress");
          expect(nextSortStep({ ...base, remainingTurns: 0 })).toBe("stop-credits");
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run app/lib/board/sort-loop.test.ts`
      Expected: FAIL — `Failed to resolve import "./sort-loop"`

- [ ] **Step 3: Implement the loop step**
      Create `app/lib/board/sort-loop.ts`:
      ```ts
      export interface SortLoopState {
        active: boolean;
        generating: boolean;
        unsortedCount: number;
        remainingTurns: number;
        /** Unsorted count when the last batch was sent; null before the first batch. */
        lastUnsortedCount: number | null;
      }

      export type SortLoopStep = "wait" | "send" | "stop-done" | "stop-no-progress" | "stop-credits";

      /** Spec §8: one batch of ≤ 25 per agent turn; the UI sends the next batch when a turn ends. */
      export function nextSortStep(state: SortLoopState): SortLoopStep {
        if (!state.active || state.generating) return "wait";
        if (state.unsortedCount === 0) return "stop-done";
        if (state.lastUnsortedCount !== null && state.unsortedCount >= state.lastUnsortedCount) return "stop-no-progress";
        if (state.remainingTurns <= 0) return "stop-credits";
        return "send";
      }
      ```

- [ ] **Step 4: Wire the loop into the board page**
      In `app/components/board/BoardPage.tsx` make these exact edits.
      (a) Replace
      ```ts
      import { buildTeachHandoff, type Handoff } from "@/lib/board/handoff";
      ```
      with
      ```ts
      import { buildSortHandoff, buildTeachHandoff, type Handoff } from "@/lib/board/handoff";
      import { nextSortStep } from "@/lib/board/sort-loop";
      ```
      (b) Replace
      ```ts
        const timersRef = useRef<number[]>([]);
      ```
      with
      ```ts
        const timersRef = useRef<number[]>([]);
        const [sorting, setSorting] = useState(false);
        const lastSortUnsortedRef = useRef<number | null>(null);
        const sortPendingRef = useRef(false);
        const noProgressRecheckRef = useRef(false);
      ```
      (c) Replace
      ```ts
        const sensors = useSensors(
      ```
      with
      ```ts
        // Spec §8: the UI drives one-batch agent turns until Unsorted is empty, a turn makes no progress,
        // credits run out or the user stops it.
        useEffect(() => {
          if (isGenerating) sortPendingRef.current = false;
          if (!board || sortPendingRef.current) return;
          const step = nextSortStep({
            active: sorting,
            generating: isGenerating,
            unsortedCount: board.unsorted.length,
            remainingTurns: usage?.remaining ?? 1,
            lastUnsortedCount: lastSortUnsortedRef.current,
          });
          if (step === "wait") return;
          if (step === "stop-no-progress" && !noProgressRecheckRef.current) {
            // The turn may have ended before this tab refetched: re-read the board once before giving up.
            noProgressRecheckRef.current = true;
            void boardQuery.refetch().then((result) => {
              const fresh = result.data?.unsorted.length;
              const last = lastSortUnsortedRef.current;
              if (fresh !== undefined && last !== null && fresh < last) return; // new data re-runs this effect
              noProgressRecheckRef.current = false;
              setSorting(false);
              lastSortUnsortedRef.current = null;
              toast.error("The agent's last turn sorted nothing, so sorting stopped. Try again or sort by hand.");
            });
            return;
          }
          if (step === "send") {
            noProgressRecheckRef.current = false;
            sortPendingRef.current = true;
            lastSortUnsortedRef.current = board.unsorted.length;
            void (async () => {
              if (await hasCredits()) {
                handOff(buildSortHandoff());
                return;
              }
              sortPendingRef.current = false;
              setSorting(false);
            })();
            return;
          }
          setSorting(false);
          lastSortUnsortedRef.current = null;
          noProgressRecheckRef.current = false;
          if (step === "stop-done") toast.success("Every note is sorted.");
          if (step === "stop-credits" && usage) toast.error(dailyLimitMessage(usage.limit));
        }, [board, sorting, isGenerating, usage]);

        function toggleSorting(): void {
          if (sorting) {
            setSorting(false);
            lastSortUnsortedRef.current = null;
            return;
          }
          sortPendingRef.current = false;
          noProgressRecheckRef.current = false;
          lastSortUnsortedRef.current = null;
          setSorting(true);
        }

        const sensors = useSensors(
      ```
      (d) Replace
      ```tsx
                sorting={false}
                onSortToggle={null}
      ```
      with
      ```tsx
                sorting={sorting}
                onSortToggle={toggleSorting}
      ```

- [ ] **Step 5: Run the test and typecheck (the gate)**
      Run: `pnpm vitest run app/lib/board/sort-loop.test.ts && pnpm typecheck && echo SORT_LOOP_OK`
      Expected: PASS — `Tests  3 passed (3)` then `SORT_LOOP_OK`

- [ ] **Step 6: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add the batched "Sort with agent" loop`

---

### Task 36: Live sort-batch e2e (needs `OPENROUTER_API_KEY`)

**Files:**
- Create: `e2e/sort-batch.spec.ts`

**Depends on:** Task 32, Task 33, Task 35
**Effort:** high
**Model tier:** top
**Provides:** `e2e/sort-batch.spec.ts (live, TURN_BUDGET_MS=35000, retries 1)`
**Requires:** `e2e/helpers/board.ts (openFreshBoard, loadSample, noteByText, column, dragTo, agentState)`, `BoardPage "Sort with agent" / "Stop sorting" loop (one batch per turn)`, `e2e/money-shot.spec.ts (live, TURN_BUDGET_MS=35000, retries 1)`

Uses the user's OpenRouter key from `.env` (the local agent settings were added by Task 33; this task reads no secret). **Timing flake rule:** one built-in retry; two misses of 35 s → set `AGENT_MODEL=anthropic/claude-haiku-5.5` in `.env` and re-run; never change the flow or the batch size.

- [ ] **Step 1: Check the key name exists (never its value)**
      Run: `test "$(grep -c '^OPENROUTER_API_KEY=' .env 2>/dev/null)" -ge 1 && echo KEY_PRESENT`
      Expected: `KEY_PRESENT` (otherwise stop and ask the user to add the key to `.env`)

- [ ] **Step 2: Write the spec**
      Create `e2e/sort-batch.spec.ts`:
      ```ts
      import { expect, test } from "@playwright/test";

      import { agentState, column, loadSample, openFreshBoard } from "./helpers/board";

      const TURN_BUDGET_MS = 35_000;

      test.describe.configure({ retries: 1 });

      test("one sort turn files one batch of up to 25 unsorted notes inside the turn budget", async ({ page, baseURL }) => {
        test.setTimeout(240_000);
        await openFreshBoard(page, baseURL ?? "", { autoTeach: false });
        await loadSample(page);
        const unsorted = column(page, "Unsorted").locator("[data-note-id]");
        await expect(unsorted).toHaveCount(50);

        await page.getByRole("button", { name: "Sort with agent" }).click();
        const startedAt = Date.now();
        await expect(agentState(page)).toHaveAttribute("data-agent-state", "running", { timeout: 15_000 });
        // Stop the loop now so it does not send a second batch when this turn ends.
        await page.getByRole("button", { name: "Stop sorting" }).click();
        await expect(agentState(page)).toHaveAttribute("data-agent-state", "idle", { timeout: TURN_BUDGET_MS + 20_000 });
        const elapsed = Date.now() - startedAt;
        expect(elapsed, `sort turn took ${elapsed} ms`).toBeLessThan(TURN_BUDGET_MS);

        await expect.poll(async () => 50 - (await unsorted.count()), { timeout: 10_000 }).toBeGreaterThanOrEqual(20);
        const sorted = 50 - (await unsorted.count());
        expect(sorted).toBeLessThanOrEqual(25);
        const agentMoved = page.locator('[data-moved-by="agent"]');
        expect(await agentMoved.count()).toBe(sorted);
        for (const reason of await page.locator(".stigi-note__reason").allInnerTexts()) {
          expect(reason.replace(/^Agent:\s*/, "").trim().length).toBeGreaterThan(3);
        }
      });
      ```

- [ ] **Step 3: Run it locally (the gate)**
      Restart any running dev server first; Playwright starts its own on port 8080.
      Run: `pnpm exec playwright test e2e/sort-batch.spec.ts --project=local`
      Expected: exit code 0 — `1 passed` (or `1 flaky` if the one allowed retry was used). Two misses of 35 s → apply the timing flake rule.

- [ ] **Step 4: Commit (kernel-performed — no agent runs this)**
      Message: `test: add the live one-batch sort e2e with the 35 s turn budget`

---

### Task 37: `merge-clusters`, `delete-cluster` and `reset-board` actions

**Files:**
- Create: `actions/merge-clusters.ts`
- Create: `actions/delete-cluster.ts`
- Create: `actions/reset-board.ts`
- Test: `actions/cluster-maintenance.test.ts`

**Depends on:** Task 2, Task 16, Task 17, Task 19, Task 20
**Effort:** medium
**Provides:** `action merge-clusters { sourceClusterId: string; targetClusterId: string }`, `action delete-cluster { clusterId: string }`, `action reset-board {} (UI only)`
**Requires:** `getOwnedCluster(ownerEmail: string, clusterId: string): Promise<ClusterRow>`, `nextNotePosition(ownerEmail: string, clusterId: string | null): Promise<number>`, `loadBoard(ownerEmail: string): Promise<BoardSnapshot>`, `requireOwner(ctx: OwnerContext | undefined): string`, `actorFromCtx(ctx: CallerContext | undefined): Actor`, `action create-cluster { name?: string; noteIds?: string[] } -> { id, name, message }`, `action move-notes { moves: { noteId: string; clusterId: string | null; reason?: string }[] }`, `action import-notes { csv?: string; sample?: boolean }`, `resetTestDb(): Promise<void>`, `getDb(): PgDatabase (typed with schema)`, `schema.stigiReports`

- [ ] **Step 1: Write the failing test**
      Create `actions/cluster-maintenance.test.ts`:
      ```ts
      import { beforeEach, describe, expect, it } from "vitest";

      import { getDb, schema } from "../server/db/index.js";
      import { resetTestDb } from "../server/db/test-db.js";
      import { loadBoard } from "../server/lib/board-store.js";
      import createCluster from "./create-cluster.js";
      import deleteCluster from "./delete-cluster.js";
      import importNotes from "./import-notes.js";
      import mergeClusters from "./merge-clusters.js";
      import moveNotes from "./move-notes.js";
      import resetBoard from "./reset-board.js";

      const OWNER = "ada@stigi.test";
      const user = { userEmail: OWNER, caller: "frontend" as const };
      const agent = { userEmail: OWNER, caller: "tool" as const };
      const bob = { userEmail: "bob@stigi.test", caller: "frontend" as const };

      async function twoClusters() {
        await importNotes.run({ csv: "comment\nA\nB\nC\n" }, user);
        const ids = (await loadBoard(OWNER)).unsorted.map((n) => n.id);
        const source = await createCluster.run({ name: "Source", noteIds: [ids[0] ?? "", ids[1] ?? ""] }, user);
        const target = await createCluster.run({ name: "Target", noteIds: [ids[2] ?? ""] }, user);
        return { source: source.id, target: target.id };
      }

      describe("cluster maintenance", () => {
        beforeEach(async () => {
          await resetTestDb();
        });

        it("merges a cluster into another and records the agent's reason", async () => {
          const { source, target } = await twoClusters();
          const result = await mergeClusters.run({ sourceClusterId: source, targetClusterId: target }, agent);
          expect(result.moved).toBe(2);
          const board = await loadBoard(OWNER);
          expect(board.clusters.map((c) => c.name)).toEqual(["Target"]);
          const merged = board.clusters[0]?.notes ?? [];
          expect(merged).toHaveLength(3);
          expect(merged.filter((n) => n.movedBy === "agent").map((n) => n.reason)).toEqual(['Merged into "Target"', 'Merged into "Target"']);
          await expect(mergeClusters.run({ sourceClusterId: target, targetClusterId: target }, user)).rejects.toThrow(/different clusters/);
        });

        it("deletes a cluster and returns its notes to Unsorted", async () => {
          const { source } = await twoClusters();
          const result = await deleteCluster.run({ clusterId: source }, user);
          expect(result.unsorted).toBe(2);
          const board = await loadBoard(OWNER);
          expect(board.clusters.map((c) => c.name)).toEqual(["Target"]);
          expect(board.unsorted.every((n) => n.movedBy === "user" && n.reason === null)).toBe(true);
          await expect(deleteCluster.run({ clusterId: source }, user)).rejects.toThrow(/Cluster not found/);
        });

        it("resets only the caller's board, report included", async () => {
          await twoClusters();
          await importNotes.run({ csv: "comment\nBob's note\n" }, bob);
          await getDb().insert(schema.stigiReports).values({ ownerEmail: OWNER, markdown: "# r", updatedBy: "user", updatedAt: "2026-11-09T10:00:00.000Z" });
          await resetBoard.run({}, user);
          expect((await loadBoard(OWNER)).totalNotes).toBe(0);
          expect((await loadBoard(OWNER)).clusters).toHaveLength(0);
          expect(await getDb().select().from(schema.stigiReports)).toHaveLength(0);
          expect((await loadBoard("bob@stigi.test")).totalNotes).toBe(1);
        });

        it("clears agent reasons when a cluster is deleted", async () => {
          const { source, target } = await twoClusters();
          const noteId = (await loadBoard(OWNER)).clusters.find((c) => c.id === source)?.notes[0]?.id ?? "";
          await moveNotes.run({ moves: [{ noteId, clusterId: target, reason: "Same theme" }] }, agent);
          await deleteCluster.run({ clusterId: target }, user);
          const back = (await loadBoard(OWNER)).unsorted.find((n) => n.id === noteId);
          expect(back?.reason).toBeNull();
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run actions/cluster-maintenance.test.ts`
      Expected: FAIL — `Failed to resolve import "./delete-cluster.js"`

- [ ] **Step 3: Implement the three actions**
      Create `actions/merge-clusters.ts`:
      ```ts
      import { defineAction, fail } from "@agent-native/core/action";
      import { and, asc, eq } from "drizzle-orm";
      import { z } from "zod";

      import { getDb, schema } from "../server/db/index.js";
      import { getOwnedCluster, nextNotePosition } from "../server/lib/board-store.js";
      import { actorFromCtx } from "../server/lib/caller.js";
      import { requireOwner } from "../server/lib/owner.js";
      import { UNTITLED_LABEL } from "../shared/board-types.js";

      export default defineAction({
        description: "Merge one cluster into another: every note moves to the target and the source cluster is removed.",
        schema: z.object({
          sourceClusterId: z.string().min(1).describe("Cluster to merge away."),
          targetClusterId: z.string().min(1).describe("Cluster that receives the notes."),
        }),
        run: async ({ sourceClusterId, targetClusterId }, ctx) => {
          const owner = requireOwner(ctx);
          const actor = actorFromCtx(ctx);
          if (sourceClusterId === targetClusterId) {
            fail("Pick two different clusters to merge.", { errorCode: "invalid_input", statusCode: 400 });
          }
          await getOwnedCluster(owner, sourceClusterId);
          const target = await getOwnedCluster(owner, targetClusterId);
          const targetName = target.name ?? UNTITLED_LABEL;
          const db = getDb();
          const notes = schema.stigiNotes;
          const moving = await db.select({ id: notes.id }).from(notes)
            .where(and(eq(notes.ownerEmail, owner), eq(notes.clusterId, sourceClusterId)))
            .orderBy(asc(notes.position));
          const now = new Date().toISOString();
          let position = await nextNotePosition(owner, targetClusterId);
          for (const row of moving) {
            await db.update(notes)
              .set({
                clusterId: targetClusterId,
                reason: actor === "agent" ? `Merged into "${targetName}"` : null,
                movedBy: actor,
                movedAt: now,
                position,
              })
              .where(and(eq(notes.ownerEmail, owner), eq(notes.id, row.id)));
            position += 1;
          }
          await db.delete(schema.stigiClusters)
            .where(and(eq(schema.stigiClusters.ownerEmail, owner), eq(schema.stigiClusters.id, sourceClusterId)));
          return { id: targetClusterId, moved: moving.length, message: `Merged ${moving.length} notes into "${targetName}".` };
        },
      });
      ```
      Create `actions/delete-cluster.ts`:
      ```ts
      import { defineAction } from "@agent-native/core/action";
      import { and, asc, eq } from "drizzle-orm";
      import { z } from "zod";

      import { getDb, schema } from "../server/db/index.js";
      import { getOwnedCluster, nextNotePosition } from "../server/lib/board-store.js";
      import { actorFromCtx } from "../server/lib/caller.js";
      import { requireOwner } from "../server/lib/owner.js";

      export default defineAction({
        description: "Delete a cluster; its notes go back to Unsorted (no note is ever deleted).",
        schema: z.object({ clusterId: z.string().min(1).describe("The cluster to delete.") }),
        run: async ({ clusterId }, ctx) => {
          const owner = requireOwner(ctx);
          const actor = actorFromCtx(ctx);
          await getOwnedCluster(owner, clusterId);
          const db = getDb();
          const notes = schema.stigiNotes;
          const moving = await db.select({ id: notes.id }).from(notes)
            .where(and(eq(notes.ownerEmail, owner), eq(notes.clusterId, clusterId)))
            .orderBy(asc(notes.position));
          const now = new Date().toISOString();
          let position = await nextNotePosition(owner, null);
          for (const row of moving) {
            await db.update(notes)
              .set({ clusterId: null, reason: null, movedBy: actor, movedAt: now, position })
              .where(and(eq(notes.ownerEmail, owner), eq(notes.id, row.id)));
            position += 1;
          }
          await db.delete(schema.stigiClusters)
            .where(and(eq(schema.stigiClusters.ownerEmail, owner), eq(schema.stigiClusters.id, clusterId)));
          return { id: clusterId, unsorted: moving.length, message: `Deleted the cluster; ${moving.length} notes went back to Unsorted.` };
        },
      });
      ```
      Create `actions/reset-board.ts`:
      ```ts
      import { defineAction } from "@agent-native/core/action";
      import { eq } from "drizzle-orm";
      import { z } from "zod";

      import { getDb, schema } from "../server/db/index.js";
      import { requireOwner } from "../server/lib/owner.js";

      export default defineAction({
        description: "Clear the signed-in user's board (notes, clusters, report). UI only; the agent cannot call it.",
        schema: z.object({}),
        agentTool: false,
        run: async (_args, ctx) => {
          const owner = requireOwner(ctx);
          const db = getDb();
          await db.delete(schema.stigiNotes).where(eq(schema.stigiNotes.ownerEmail, owner));
          await db.delete(schema.stigiClusters).where(eq(schema.stigiClusters.ownerEmail, owner));
          await db.delete(schema.stigiReports).where(eq(schema.stigiReports.ownerEmail, owner));
          return { id: "board", message: "Board reset." };
        },
      });
      ```

- [ ] **Step 4: Run to confirm it passes (the gate)**
      Run: `pnpm vitest run actions/cluster-maintenance.test.ts`
      Expected: PASS — `Tests  4 passed (4)`

- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add merge-clusters, delete-cluster and reset-board actions`

---

### Task 38: Wire merge, delete and reset into the board

**Files:**
- Modify: `app/components/board/BoardPage.tsx`

**Depends on:** Task 35, Task 37
**Effort:** medium
**Provides:** `BoardPage wires merge/delete (ClusterMenu) and reset (top bar)`
**Requires:** `action merge-clusters { sourceClusterId: string; targetClusterId: string }`, `action delete-cluster { clusterId: string }`, `action reset-board {} (UI only)`, `BoardPage "Sort with agent" / "Stop sorting" loop (one batch per turn)`

UI task: applies `docs/design/frontend.md` (no browser dialogs: `ClusterMenu` deletes on a second click and `BoardTopBar` resets on a second click; every failure shows a toast). Upstream props already implemented in Tasks 29–30: `ClusterMenu` `mergeTargets: { id: string; name: string }[]`, `onMerge: ((targetClusterId: string) => void) | null`, `onDelete: (() => void) | null`; `BoardTopBar` `onResetBoard: (() => void) | null`.

- [ ] **Step 1: Add the mutations**
      In `app/components/board/BoardPage.tsx` replace
      ```ts
        const moveNotes = useActionMutation("move-notes", { onError: showError });
      ```
      with
      ```ts
        const moveNotes = useActionMutation("move-notes", { onError: showError });
        const mergeClusters = useActionMutation("merge-clusters", { onError: showError });
        const deleteCluster = useActionMutation("delete-cluster", { onError: showError });
        const resetBoard = useActionMutation("reset-board", { onError: showError });
      ```

- [ ] **Step 2: Add the reset handler**
      Replace
      ```ts
        function changeAutoTeach(value: boolean): void {
      ```
      with
      ```ts
        function resetBoardNow(): void {
          resetBoard.mutate({}, {
            onSuccess: () => {
              firedRef.current = new Set();
              setSelectedIds(new Set());
              setSorting(false);
              toast.success("Board reset.");
            },
          });
        }

        function changeAutoTeach(value: boolean): void {
      ```

- [ ] **Step 3: Pass the handlers down**
      Replace
      ```tsx
                onResetBoard={null}
      ```
      with
      ```tsx
                onResetBoard={resetBoardNow}
      ```
      and replace
      ```tsx
                                mergeTargets={[]}
                                onMerge={null}
                                onDelete={null}
      ```
      with
      ```tsx
                                mergeTargets={board.clusters
                                  .filter((c) => c.id !== cluster.id)
                                  .map((c) => ({ id: c.id, name: c.name ?? "Untitled" }))}
                                onMerge={(targetClusterId) => mergeClusters.mutate({ sourceClusterId: cluster.id, targetClusterId })}
                                onDelete={() => deleteCluster.mutate({ clusterId: cluster.id })}
      ```

- [ ] **Step 4: Typecheck and re-run the component tests (the gate)**
      Run: `pnpm typecheck && pnpm vitest run app/components/board && echo BOARD_MAINTENANCE_OK`
      Expected: `Test Files  3 passed (3)` then `BOARD_MAINTENANCE_OK`

- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
      Message: `feat: wire merge, delete and reset into the board UI`

---

### Task 39: Report actions — `get-board-digest`, `get-report`, `save-report`

**Files:**
- Create: `actions/get-board-digest.ts`
- Create: `actions/get-report.ts`
- Create: `actions/save-report.ts`
- Modify: `server/plugins/agent-chat.ts`
- Test: `actions/report.test.ts`

**Depends on:** Task 2, Task 16, Task 17, Task 24, Task 37
**Effort:** medium
**Provides:** `action get-board-digest {} -> { totalNotes, unsortedCount, sampleNotes, themes[] }`, `action get-report {} -> { markdown, updatedBy, updatedAt }`, `action save-report { markdown: string }`
**Requires:** `loadBoard(ownerEmail: string): Promise<BoardSnapshot>`, `clipText(text: string, max: number): string`, `requireOwner(ctx: OwnerContext | undefined): string`, `actorFromCtx(ctx: CallerContext | undefined): Actor`, `agent-chat plugin: Stigi system prompt, INITIAL_TOOL_NAMES, prepareRequest daily-cap guard`, `action merge-clusters { sourceClusterId: string; targetClusterId: string }`, `action import-notes { csv?: string; sample?: boolean }`, `resetTestDb(): Promise<void>`, `getDb(): PgDatabase (typed with schema)`, `schema.stigiReports`

- [ ] **Step 1: Write the failing test**
      Create `actions/report.test.ts`:
      ```ts
      import { beforeEach, describe, expect, it } from "vitest";

      import { resetTestDb } from "../server/db/test-db.js";
      import getBoardDigest from "./get-board-digest.js";
      import getReport from "./get-report.js";
      import importNotes from "./import-notes.js";
      import saveReport from "./save-report.js";

      const user = { userEmail: "ada@stigi.test", caller: "frontend" as const };
      const agent = { userEmail: "ada@stigi.test", caller: "tool" as const };

      describe("report actions", () => {
        beforeEach(async () => {
          await resetTestDb();
        });

        it("digests the board into themes by size with verbatim quotes", async () => {
          await importNotes.run({ sample: true }, user);
          const digest = await getBoardDigest.run({}, agent);
          expect(digest.totalNotes).toBe(200);
          expect(digest.unsortedCount).toBe(50);
          expect(digest.sampleNotes).toBe(200);
          expect(digest.themes).toHaveLength(6);
          expect(digest.themes.every((t) => t.noteCount === 25 && t.share === 13)).toBe(true);
          expect(digest.themes[0]?.quotes).toHaveLength(3);
          expect(digest.themes.map((t) => t.name)).toEqual([...digest.themes.map((t) => t.name)].sort((a, b) => a.localeCompare(b)));
        });

        it("starts empty, then saves and reads the report with who wrote it", async () => {
          expect(await getReport.run({}, user)).toMatchObject({ markdown: "", updatedBy: null, updatedAt: null });
          await saveReport.run({ markdown: "# Insights\n_200 comments; sample data_" }, agent);
          expect(await getReport.run({}, user)).toMatchObject({ markdown: "# Insights\n_200 comments; sample data_", updatedBy: "agent" });
          await saveReport.run({ markdown: "# Edited" }, user);
          expect(await getReport.run({}, user)).toMatchObject({ markdown: "# Edited", updatedBy: "user" });
        });

        it("keeps reports per user", async () => {
          await saveReport.run({ markdown: "# Ada" }, user);
          expect((await getReport.run({}, { userEmail: "bob@stigi.test", caller: "frontend" as const })).markdown).toBe("");
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run actions/report.test.ts`
      Expected: FAIL — `Failed to resolve import "./get-board-digest.js"`

- [ ] **Step 3: Implement the three actions**
      Create `actions/get-board-digest.ts`:
      ```ts
      import { defineAction } from "@agent-native/core/action";
      import { z } from "zod";

      import { clipText, loadBoard } from "../server/lib/board-store.js";
      import { requireOwner } from "../server/lib/owner.js";
      import { UNTITLED_LABEL } from "../shared/board-types.js";

      export default defineAction({
        description:
          "Deterministic digest for the insight report: themes by size with share and up to 3 verbatim quotes each, plus unsorted and sample counts.",
        schema: z.object({}),
        http: { method: "GET" },
        readOnly: true,
        run: async (_args, ctx) => {
          const board = await loadBoard(requireOwner(ctx));
          const total = board.totalNotes;
          const themes = board.clusters
            .filter((c) => c.notes.length > 0)
            .map((c) => ({
              clusterId: c.id,
              name: c.name ?? UNTITLED_LABEL,
              noteCount: c.notes.length,
              share: total > 0 ? Math.round((c.notes.length * 100) / total) : 0,
              quotes: c.notes.slice(0, 3).map((n) => clipText(n.body, 200)),
            }))
            .sort((a, b) => b.noteCount - a.noteCount || a.name.localeCompare(b.name));
          return {
            id: "digest",
            totalNotes: total,
            unsortedCount: board.unsorted.length,
            sampleNotes: board.sampleNotes,
            themes,
            message: `${themes.length} themes across ${total} notes.`,
          };
        },
      });
      ```
      Create `actions/get-report.ts`:
      ```ts
      import { defineAction } from "@agent-native/core/action";
      import { eq } from "drizzle-orm";
      import { z } from "zod";

      import { getDb, schema } from "../server/db/index.js";
      import { requireOwner } from "../server/lib/owner.js";

      export default defineAction({
        description: "Read the current insight report (Markdown) and who last wrote it.",
        schema: z.object({}),
        http: { method: "GET" },
        readOnly: true,
        run: async (_args, ctx) => {
          const owner = requireOwner(ctx);
          const [row] = await getDb().select().from(schema.stigiReports).where(eq(schema.stigiReports.ownerEmail, owner));
          return {
            id: "report",
            markdown: row?.markdown ?? "",
            updatedBy: row?.updatedBy ?? null,
            updatedAt: row?.updatedAt ?? null,
            message: row ? "Report loaded." : "No report yet.",
          };
        },
      });
      ```
      Create `actions/save-report.ts`:
      ```ts
      import { defineAction } from "@agent-native/core/action";
      import { z } from "zod";

      import { getDb, schema } from "../server/db/index.js";
      import { actorFromCtx } from "../server/lib/caller.js";
      import { requireOwner } from "../server/lib/owner.js";

      export default defineAction({
        description: "Save the insight report Markdown (replaces the previous version). Both the agent and the user's editor call this.",
        schema: z.object({ markdown: z.string().max(50_000).describe("The full report in Markdown.") }),
        run: async ({ markdown }, ctx) => {
          const owner = requireOwner(ctx);
          const updatedBy = actorFromCtx(ctx);
          const updatedAt = new Date().toISOString();
          await getDb().insert(schema.stigiReports)
            .values({ ownerEmail: owner, markdown, updatedBy, updatedAt })
            .onConflictDoUpdate({ target: schema.stigiReports.ownerEmail, set: { markdown, updatedBy, updatedAt } });
          return { id: "report", message: "Report saved." };
        },
      });
      ```

- [ ] **Step 4: Add the report and merge actions to the agent's starter tools**
      In `server/plugins/agent-chat.ts` replace
      ```ts
      // Report actions (get-board-digest, save-report, get-report) and merge-clusters are added in later tasks.
      const INITIAL_TOOL_NAMES = [
        "view-screen",
        "navigate",
        "list-notes",
        "create-cluster",
        "rename-cluster",
        "move-notes",
        "ask-question",
      ];
      ```
      with
      ```ts
      const INITIAL_TOOL_NAMES = [
        "view-screen",
        "navigate",
        "list-notes",
        "create-cluster",
        "rename-cluster",
        "move-notes",
        "merge-clusters",
        "get-board-digest",
        "save-report",
        "get-report",
        "ask-question",
      ];
      ```

- [ ] **Step 5: Run the tests and typecheck (the gate)**
      Run: `pnpm vitest run actions/report.test.ts && pnpm typecheck && echo REPORT_ACTIONS_OK`
      Expected: PASS — `Tests  3 passed (3)` then `REPORT_ACTIONS_OK`

- [ ] **Step 6: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add the report digest, get-report and save-report actions`

---

### Task 40: Report pane with Markdown export

**Files:**
- Create: `app/lib/board/report-export.ts`
- Create: `app/components/board/ReportPane.tsx`
- Create: `app/routes/board.report.tsx`
- Modify: `app/components/board/BoardPage.tsx`
- Test: `app/lib/board/report-export.test.ts`

**Depends on:** Task 23, Task 27, Task 31, Task 38, Task 39
**Effort:** medium
**Provides:** `reportFileName(date: Date): string`, `downloadMarkdown(markdown: string, fileName: string): void`, `<ReportPane /> at /board/report (edit, save, write with agent, export .md)`
**Requires:** `action get-report {} -> { markdown, updatedBy, updatedAt }`, `action save-report { markdown: string }`, `action get-agent-usage {} -> AgentUsage & { id, message }`, `buildReportHandoff(): Handoff`, `dailyLimitMessage(limit: number): string`, `BoardPage wires merge/delete (ClusterMenu) and reset (top bar)`, `app/routes/board.tsx renders BoardPage + Outlet with fonts and styles`

UI task: applies `docs/design/frontend.md` (the pane uses the board tokens via `.stigi-route`, the one primary/secondary button pair, mono editor; agent edits never overwrite unsaved user edits — a notice offers "Load agent version"). New routes need a dev-server restart.

- [ ] **Step 1: Write the failing test**
      Create `app/lib/board/report-export.test.ts`:
      ```ts
      // @vitest-environment happy-dom
      import { afterEach, describe, expect, it, vi } from "vitest";

      import { downloadMarkdown, reportFileName } from "./report-export";

      afterEach(() => {
        vi.restoreAllMocks();
      });

      describe("report export", () => {
        it("names the file by UTC date", () => {
          expect(reportFileName(new Date("2026-11-09T23:30:00Z"))).toBe("stigi-insight-report-2026-11-09.md");
        });

        it("downloads Markdown through a temporary link", () => {
          const createUrl = vi.fn(() => "blob:stigi");
          Object.defineProperty(URL, "createObjectURL", { value: createUrl, configurable: true });
          Object.defineProperty(URL, "revokeObjectURL", { value: vi.fn(), configurable: true });
          const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
          downloadMarkdown("# Report", "stigi-insight-report-2026-11-09.md");
          expect(createUrl).toHaveBeenCalledTimes(1);
          expect(click).toHaveBeenCalledTimes(1);
          const anchor = click.mock.instances[0] as unknown as HTMLAnchorElement;
          expect(anchor.download).toBe("stigi-insight-report-2026-11-09.md");
          expect(document.querySelector("a[download]")).toBeNull();
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run app/lib/board/report-export.test.ts`
      Expected: FAIL — `Failed to resolve import "./report-export"`

- [ ] **Step 3: Implement the export helper, the pane and the route**
      Create `app/lib/board/report-export.ts`:
      ```ts
      export function reportFileName(date: Date): string {
        return `stigi-insight-report-${date.toISOString().slice(0, 10)}.md`;
      }

      export function downloadMarkdown(markdown: string, fileName: string): void {
        const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      }
      ```
      Create `app/components/board/ReportPane.tsx`:
      ```tsx
      import { useAgentChatGenerating } from "@agent-native/core/client/agent-chat";
      import { actionErrorMessage, useActionMutation, useActionQuery } from "@agent-native/core/client/hooks";
      import { useEffect, useRef, useState } from "react";
      import { useNavigate } from "react-router";
      import { toast } from "sonner";

      import { dailyLimitMessage } from "@shared/agent-limits";

      import { buildReportHandoff } from "@/lib/board/handoff";
      import { downloadMarkdown, reportFileName } from "@/lib/board/report-export";

      export function ReportPane() {
        const navigate = useNavigate();
        const [isGenerating, sendToAgent] = useAgentChatGenerating();
        const [draft, setDraft] = useState("");
        const [dirty, setDirty] = useState(false);
        const [agentVersion, setAgentVersion] = useState<string | null>(null);
        const lastServerRef = useRef<string | null>(null);
        const reportQuery = useActionQuery("get-report", {}, { refetchInterval: isGenerating ? 2_000 : false });
        const usageQuery = useActionQuery("get-agent-usage", {});
        const saveReport = useActionMutation("save-report", {
          onError: (error) => toast.error(actionErrorMessage(error)),
          onSuccess: () => {
            setDirty(false);
            toast.success("Report saved.");
          },
        });
        const report = reportQuery.data;
        const remaining = usageQuery.data?.remaining ?? 1;

        // Load the server version whenever the user has no unsaved edits (the editor stays disabled until the
        // first load, so nothing typed is lost); otherwise offer the agent's new version instead of overwriting.
        useEffect(() => {
          if (!report) return;
          if (lastServerRef.current === report.markdown) return;
          lastServerRef.current = report.markdown;
          if (!dirty) {
            setDraft(report.markdown);
            setAgentVersion(null);
            return;
          }
          if (report.updatedBy === "agent") setAgentVersion(report.markdown);
        }, [report, dirty]);

        async function writeWithAgent(): Promise<void> {
          const latest = (await usageQuery.refetch()).data;
          if (latest && latest.remaining <= 0) {
            toast.error(dailyLimitMessage(latest.limit));
            return;
          }
          const handoff = buildReportHandoff();
          sendToAgent({ message: handoff.message, context: handoff.context, submit: true, openSidebar: true });
        }

        return (
          <aside className="stigi-report" aria-label="Insight report" data-testid="report-pane">
            <div className="stigi-report__header">
              <h2>Insight report</h2>
              <button type="button" className="stigi-btn stigi-btn--secondary" onClick={() => navigate("/board")}>Close</button>
            </div>
            {agentVersion !== null ? (
              <p className="stigi-report__notice">
                The agent updated the report ·{" "}
                <button
                  type="button"
                  className="stigi-link"
                  onClick={() => {
                    setDraft(agentVersion);
                    setDirty(false);
                    setAgentVersion(null);
                  }}
                >
                  Load agent version
                </button>
              </p>
            ) : null}
            <textarea
              className="stigi-report__editor"
              aria-label="Report markdown"
              value={draft}
              disabled={reportQuery.isPending}
              placeholder="Ask the agent to write the report, or start typing Markdown."
              onChange={(e) => {
                setDraft(e.target.value);
                setDirty(true);
              }}
            />
            <div className="stigi-report__actions">
              <button type="button" className="stigi-btn stigi-btn--primary" disabled={!dirty || saveReport.isPending}
                onClick={() => saveReport.mutate({ markdown: draft })}>
                Save
              </button>
              <button type="button" className="stigi-btn stigi-btn--secondary" disabled={isGenerating || remaining <= 0}
                onClick={() => void writeWithAgent()}>
                {isGenerating ? "Agent writing…" : "Write with agent"}
              </button>
              <button type="button" className="stigi-btn stigi-btn--secondary" disabled={draft.trim().length === 0}
                onClick={() => downloadMarkdown(draft, reportFileName(new Date()))}>
                Export .md
              </button>
            </div>
          </aside>
        );
      }
      ```
      Create `app/routes/board.report.tsx`:
      ```tsx
      import { ReportPane } from "@/components/board/ReportPane";

      export function meta() {
        return [{ title: "Insight report · Stigi" }];
      }

      export default function BoardReportRoute() {
        return <ReportPane />;
      }
      ```

- [ ] **Step 4: Open the report from the board's top bar**
      In `app/components/board/BoardPage.tsx` replace
      ```ts
      import { useEffect, useMemo, useRef, useState } from "react";
      ```
      with
      ```ts
      import { useEffect, useMemo, useRef, useState } from "react";
      import { useNavigate } from "react-router";
      ```
      replace
      ```ts
        const [isGenerating, sendToAgent] = useAgentChatGenerating();
      ```
      with
      ```ts
        const [isGenerating, sendToAgent] = useAgentChatGenerating();
        const navigate = useNavigate();
      ```
      and replace
      ```tsx
                onOpenReport={null}
      ```
      with
      ```tsx
                onOpenReport={() => navigate("/board/report")}
      ```

- [ ] **Step 5: Run the test and typecheck (the gate)**
      Run: `pnpm vitest run app/lib/board/report-export.test.ts && pnpm typecheck && echo REPORT_PANE_OK`
      Expected: PASS — `Tests  2 passed (2)` then `REPORT_PANE_OK`

- [ ] **Step 6: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add the editable insight report pane with Markdown export`

---

### Task 41: CSV import dialog

**Files:**
- Create: `app/components/board/ImportCsvDialog.tsx`
- Modify: `app/components/board/BoardPage.tsx`
- Test: `app/components/board/ImportCsvDialog.test.tsx`

**Depends on:** Task 17, Task 40
**Effort:** medium
**Provides:** `<ImportCsvDialog open onClose onImport />`, `BoardPage wires CSV import (top bar + empty board)`
**Requires:** `action import-notes { csv?: string; sample?: boolean }`, `<ReportPane /> at /board/report (edit, save, write with agent, export .md)`

UI task: applies `docs/design/frontend.md` (one dialog surface on the board tokens, verb + object buttons, no browser `prompt`/`alert`).

- [ ] **Step 1: Write the failing test**
      Create `app/components/board/ImportCsvDialog.test.tsx`:
      ```tsx
      // @vitest-environment happy-dom
      import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
      import { afterEach, describe, expect, it, vi } from "vitest";

      import { ImportCsvDialog } from "./ImportCsvDialog";

      afterEach(() => cleanup());

      describe("ImportCsvDialog", () => {
        it("renders nothing when closed", () => {
          render(<ImportCsvDialog open={false} onClose={vi.fn()} onImport={vi.fn()} />);
          expect(screen.queryByRole("dialog")).toBeNull();
        });

        it("imports pasted CSV and closes on success", async () => {
          const onImport = vi.fn(async () => true);
          const onClose = vi.fn();
          render(<ImportCsvDialog open={true} onClose={onClose} onImport={onImport} />);
          expect(screen.getByRole("dialog", { name: "Import feedback from CSV" })).toBeTruthy();
          fireEvent.change(screen.getByLabelText("Paste CSV"), { target: { value: "comment\nToo slow" } });
          fireEvent.click(screen.getByRole("button", { name: "Import pasted CSV" }));
          await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
          expect(onImport).toHaveBeenCalledWith("comment\nToo slow");
        });

        it("imports a chosen file and stays open when the import fails", async () => {
          const onImport = vi.fn(async () => false);
          const onClose = vi.fn();
          render(<ImportCsvDialog open={true} onClose={onClose} onImport={onImport} />);
          const file = new File(["comment\nFrom a file"], "feedback.csv", { type: "text/csv" });
          fireEvent.change(screen.getByLabelText("CSV file"), { target: { files: [file] } });
          await waitFor(() => expect(onImport).toHaveBeenCalledWith("comment\nFrom a file"));
          expect(onClose).not.toHaveBeenCalled();
          fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
          expect(onClose).toHaveBeenCalledTimes(1);
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run app/components/board/ImportCsvDialog.test.tsx`
      Expected: FAIL — `Failed to resolve import "./ImportCsvDialog"`

- [ ] **Step 3: Implement the dialog**
      Create `app/components/board/ImportCsvDialog.tsx`:
      ```tsx
      import { useRef, useState } from "react";

      export interface ImportCsvDialogProps {
        open: boolean;
        onClose: () => void;
        /** Resolves true when the import succeeded (the caller shows any error toast). */
        onImport: (csv: string) => Promise<boolean>;
      }

      export function ImportCsvDialog({ open, onClose, onImport }: ImportCsvDialogProps) {
        const [text, setText] = useState("");
        const [busy, setBusy] = useState(false);
        const fileRef = useRef<HTMLInputElement>(null);
        if (!open) return null;

        async function submit(csv: string): Promise<void> {
          if (csv.trim().length === 0) return;
          setBusy(true);
          const ok = await onImport(csv);
          setBusy(false);
          if (ok) {
            setText("");
            onClose();
          }
        }

        return (
          <div className="stigi-dialog-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="stigi-dialog" role="dialog" aria-modal="true" aria-labelledby="stigi-import-title">
              <h2 id="stigi-import-title">Import feedback from CSV</h2>
              <p className="stigi-meta">
                One comment per row. A column named comment, feedback, text, body, note or message is used; otherwise the first
                column. A board holds up to 500 notes.
              </p>
              <button type="button" className="stigi-btn stigi-btn--secondary" disabled={busy} onClick={() => fileRef.current?.click()}>
                Choose a CSV file
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="stigi-sr-only"
                aria-label="CSV file"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) await submit(await file.text());
                  e.target.value = "";
                }}
              />
              <textarea aria-label="Paste CSV" value={text} onChange={(e) => setText(e.target.value)}
                placeholder={"comment\nThe export is slow\nLove the receipt scanner"} />
              <div className="stigi-report__actions">
                <button type="button" className="stigi-btn stigi-btn--primary" disabled={busy || text.trim().length === 0}
                  onClick={() => void submit(text)}>
                  Import pasted CSV
                </button>
                <button type="button" className="stigi-btn stigi-btn--secondary" onClick={onClose}>Cancel</button>
              </div>
            </div>
          </div>
        );
      }
      ```

- [ ] **Step 4: Wire it into the board page**
      In `app/components/board/BoardPage.tsx` replace
      ```ts
      import { EmptyBoard } from "./EmptyBoard";
      ```
      with
      ```ts
      import { EmptyBoard } from "./EmptyBoard";
      import { ImportCsvDialog } from "./ImportCsvDialog";
      ```
      replace
      ```ts
        const [sorting, setSorting] = useState(false);
      ```
      with
      ```ts
        const [sorting, setSorting] = useState(false);
        const [importOpen, setImportOpen] = useState(false);
      ```
      replace
      ```ts
        function changeAutoTeach(value: boolean): void {
      ```
      with
      ```ts
        async function importCsv(csv: string): Promise<boolean> {
          try {
            const result = await importNotes.mutateAsync({ csv });
            toast.success(result.message);
            return true;
          } catch {
            return false; // onError already showed the reason
          }
        }

        function changeAutoTeach(value: boolean): void {
      ```
      replace
      ```tsx
                onImportCsv={null}
      ```
      with
      ```tsx
                onImportCsv={() => setImportOpen(true)}
      ```
      replace
      ```tsx
                <EmptyBoard loading={importNotes.isPending} onLoadSample={loadSample} onImportCsv={null} />
      ```
      with
      ```tsx
                <EmptyBoard loading={importNotes.isPending} onLoadSample={loadSample} onImportCsv={() => setImportOpen(true)} />
      ```
      and replace
      ```tsx
              <SelectionBar
      ```
      with
      ```tsx
              <ImportCsvDialog open={importOpen} onClose={() => setImportOpen(false)} onImport={importCsv} />
              <SelectionBar
      ```

- [ ] **Step 5: Run the test and typecheck (the gate)**
      Run: `pnpm vitest run app/components/board/ImportCsvDialog.test.tsx && pnpm typecheck && echo CSV_DIALOG_OK`
      Expected: PASS — `Tests  3 passed (3)` then `CSV_DIALOG_OK`

- [ ] **Step 6: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add the CSV import dialog`

---

### Task 42: Report export e2e (no LLM key)

**Files:**
- Create: `e2e/report-export.spec.ts`

**Depends on:** Task 32, Task 40, Task 41
**Effort:** medium
**Provides:** `e2e/report-export.spec.ts`
**Requires:** `e2e/helpers/board.ts (openFreshBoard, loadSample, noteByText, column, dragTo, agentState)`, `<ReportPane /> at /board/report (edit, save, write with agent, export .md)`, `BoardPage wires CSV import (top bar + empty board)`

- [ ] **Step 1: Write the spec**
      Create `e2e/report-export.spec.ts`:
      ```ts
      import { readFileSync } from "node:fs";

      import { expect, test } from "@playwright/test";

      import { loadSample, openFreshBoard } from "./helpers/board";

      test("the report pane edits, saves, survives a reload and exports Markdown", async ({ page, baseURL }) => {
        await openFreshBoard(page, baseURL ?? "", { autoTeach: false });
        await loadSample(page);
        await page.getByRole("button", { name: "Report", exact: true }).click();
        const pane = page.getByTestId("report-pane");
        await expect(pane).toBeVisible();

        await pane.getByLabel("Report markdown").fill(
          "# Customer feedback insights\n_200 comments; sample data_\n\n## Top themes\n1. **Plan & billing confusion** — 16 comments",
        );
        await pane.getByRole("button", { name: "Save", exact: true }).click();
        await expect(page.getByText("Report saved.")).toBeVisible();

        await page.reload();
        await expect(page.getByTestId("report-pane").getByLabel("Report markdown")).toHaveValue(/Plan & billing confusion/);

        const downloadPromise = page.waitForEvent("download");
        await page.getByTestId("report-pane").getByRole("button", { name: "Export .md" }).click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/^stigi-insight-report-\d{4}-\d{2}-\d{2}\.md$/);
        const filePath = await download.path();
        expect(readFileSync(filePath, "utf8")).toContain("sample data");
      });
      ```

- [ ] **Step 2: Run it locally (the gate)**
      Restart any running dev server first (the `/board/report` route is new); Playwright starts its own on port 8080.
      Run: `pnpm exec playwright test e2e/report-export.spec.ts --project=local`
      Expected: PASS — `1 passed`

- [ ] **Step 3: Commit (kernel-performed — no agent runs this)**
      Message: `test: add the report edit-save-export e2e`
