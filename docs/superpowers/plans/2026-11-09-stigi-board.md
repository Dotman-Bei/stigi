# Stigi Board (Money-Shot Slice) Implementation Plan

**Goal:** Land the demo money shot end-to-end: a pre-sorted 200-note sample board where dragging two notes into a new cluster makes the agent name it and pull ~12 matching notes in from across the board, each with a one-line reason — with the shared action layer, app-state, daily cap and agent instructions behind it.
**Architecture:** Deterministic `defineAction()` actions (import, read, create/rename/move, list, view-screen, usage) over the `stigi_*` tables are the single implementation the UI (`useActionQuery`/`useActionMutation`), the agent (tool calls), CLI and HTTP all use. The board UI (`/board`) renders clusters with `@dnd-kit/core` drag-and-drop and `motion` layout animation, writes `selection` app-state, and hands teach requests to the agent with `useAgentChatGenerating()` (hidden context carries ids). The agent follows `AGENTS.md` + the `teach-cluster` skill; the agent-chat plugin enforces the per-user daily cap in `prepareRequest`.
**Tech Stack:** `@agent-native/core 0.226.0`, React 19.3, React Router 8.1.0, Drizzle `^0.45.3`, Zod `^4.4.3`, h3 `2.0.8`, `@dnd-kit/core 6.3.1`, `motion 14.10.1`, Vitest `^4.1.5` + happy-dom `20.12.0` + `@testing-library/react 16.3.3` / `@testing-library/dom 10.4.2`, `@playwright/test 1.65.0`, sonner (template).
**Source spec:** docs/superpowers/specs/2026-11-09-stigi-design.md

**Rules for every task in the five Stigi plans:**
- Task numbers are **global** across the five plans (foundation 1–3, deploy 6–13 and 50–52, board 14–33, sort-report 34–42, ship 43–44). A `Depends on` may name a task in another plan.
- Run every command from the repo root in **Git Bash** (POSIX). Never print, echo or commit a secret; env vars are referenced by name only. Never read `.env` (presence checks use `grep -c '^NAME=' .env`, which prints a count, never a value).
- TypeScript is strict with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`: index access yields `T | undefined`; never pass `undefined` to an optional property; never `as any`.
- Server and action code imports shared code with relative paths (`../shared/...`); app code uses `@/` and `@shared/`.
- Every task that touches sample data keeps the "sample" label (`source: "sample"`, `created_by: "sample"`, chip "Sample data · pre-sorted starting layout", copy).
- Action tests call `action.run(args, ctx)` directly (schema defaults are NOT applied, so pass every field) with `ctx = { userEmail, caller: "frontend" }` for the user or `caller: "tool"` for the agent, against in-memory PGlite reset by `resetTestDb()`.
- UI tasks follow `docs/design/frontend.md` (tokens, type, radius, motion, one button/card system; kit at `docs/design/frontend-kit/`).
- **Timing flake rule (spec D17):** `money-shot.spec.ts` has one built-in retry; if the 35 s budget is missed on both attempts, set `AGENT_MODEL=anthropic/claude-haiku-5.5` in `.env` and re-run — never rewrite the flow, the batch sizes or the budget.
- Step "Commit" is performed by the orchestrator/kernel, never by the executor.

**Upstream signatures used throughout (from Task 2, `shared/board-types.ts`, `server/db/*`, `server/lib/owner.ts`, `server/lib/caller.ts`):**
```ts
// shared/board-types.ts
export type Actor = "user" | "agent";
export type ClusterOrigin = "user" | "agent" | "sample";
export type NoteSource = "sample" | "import";
export interface BoardNote { id: string; body: string; source: NoteSource; clusterId: string | null; reason: string | null; movedBy: Actor | null; movedAt: string | null; position: number }
export interface BoardCluster { id: string; name: string | null; createdBy: ClusterOrigin; position: number; notes: BoardNote[] }
export interface BoardSnapshot { clusters: BoardCluster[]; unsorted: BoardNote[]; totalNotes: number; sampleNotes: number }
export interface AgentUsage { used: number; limit: number; remaining: number; resetsAt: string }
export const MAX_BOARD_NOTES = 500; export const MAX_MOVES_PER_CALL = 50; export const MAX_REASON_CHARS = 140;
export const MAX_CLUSTER_NAME_CHARS = 60; export const UNTITLED_LABEL = "Untitled";
// server/db/index.ts — getDb() is the typed Drizzle client; schema = { stigiClusters, stigiNotes, stigiReports, stigiAgentTurns }
// columns: stigiClusters{id, ownerEmail, name, createdBy, position, createdAt, updatedAt}
//          stigiNotes{id, ownerEmail, body, source, clusterId, reason, movedBy, movedAt, position, createdAt}
//          stigiReports{ownerEmail, markdown, updatedBy, updatedAt}; stigiAgentTurns{ownerEmail, day, count}
// server/db/test-db.ts — resetTestDb(): Promise<void>
// server/lib/owner.ts — requireOwner(ctx: { userEmail?: string | undefined } | undefined): string  (fails 401 "Sign in to use Stigi.")
// server/lib/caller.ts — actorFromCtx(ctx: { caller?: string | undefined } | undefined): Actor  ("tool" → "agent")
```

---

### Task 14: Labeled sample feedback with a pre-sorted starting layout

**Files:**
- Create: `shared/sample-feedback.ts`
- Test: `shared/sample-feedback.test.ts`

**Depends on:** Task 2
**Effort:** low
**Provides:** `SAMPLE_FEEDBACK: readonly SampleFeedback[] (200 labeled sample notes)`, `SAMPLE_START_CLUSTERS (6 starting cluster names)`, `SAMPLE_LABEL = "Sample data · pre-sorted starting layout"`, `MONEY_SHOT_SEEDS = ["which plan am I even on?", "the billing page makes no sense"]`
**Requires:** `type BoardSnapshot`

Spec D15: 150 notes in 6 deliberately imperfect starting clusters + 50 unsorted. The 16 plan/billing notes are the 2 money-shot seeds plus 14 scattered across the wrong clusters and Unsorted, so the teach pulls from across the board with no prior agent sort. Synthetic comments for a fictional expenses app; the `theme` field is for tests only and is never shown to the agent.

- [ ] **Step 1: Write the failing test**
      Create `shared/sample-feedback.test.ts`:
      ```ts
      import { describe, expect, it } from "vitest";

      import { MONEY_SHOT_SEEDS, SAMPLE_FEEDBACK, SAMPLE_LABEL, SAMPLE_START_CLUSTERS } from "./sample-feedback";

      function countBy<T>(items: readonly T[], key: (item: T) => string): Record<string, number> {
        const out: Record<string, number> = {};
        for (const item of items) out[key(item)] = (out[key(item)] ?? 0) + 1;
        return out;
      }

      describe("sample feedback", () => {
        it("has 200 unique, reasonably sized comments", () => {
          expect(SAMPLE_FEEDBACK).toHaveLength(200);
          const lowered = new Set(SAMPLE_FEEDBACK.map((s) => s.body.toLowerCase()));
          expect(lowered.size).toBe(200);
          for (const s of SAMPLE_FEEDBACK) {
            expect(s.body.length).toBeGreaterThanOrEqual(10);
            expect(s.body.length).toBeLessThanOrEqual(200);
          }
        });

        it("ships a pre-sorted layout: 6 clusters of 25 plus 50 unsorted", () => {
          expect(SAMPLE_START_CLUSTERS).toHaveLength(6);
          const byStart = countBy(SAMPLE_FEEDBACK, (s) => s.start ?? "unsorted");
          for (const name of SAMPLE_START_CLUSTERS) expect(byStart[name]).toBe(25);
          expect(byStart.unsorted).toBe(50);
        });

        it("has the agreed theme distribution", () => {
          expect(countBy(SAMPLE_FEEDBACK, (s) => s.theme)).toEqual({
            "plan-billing": 16, onboarding: 26, mobile: 26, "bank-sync": 26, export: 24,
            notifications: 20, "feature-request": 22, performance: 20, praise: 20,
          });
        });

        it("scatters the plan/billing notes across the board for the money shot", () => {
          const seeds = SAMPLE_FEEDBACK.filter((s) => (MONEY_SHOT_SEEDS as readonly string[]).includes(s.body));
          expect(seeds.map((s) => s.theme)).toEqual(["plan-billing", "plan-billing"]);
          expect(seeds.every((s) => s.start !== null)).toBe(true);
          const others = SAMPLE_FEEDBACK.filter((s) => s.theme === "plan-billing" && !(MONEY_SHOT_SEEDS as readonly string[]).includes(s.body));
          expect(others).toHaveLength(14);
          expect(new Set(others.map((s) => s.start ?? "unsorted")).size).toBeGreaterThanOrEqual(6);
        });

        it("labels the layout as sample data", () => {
          expect(SAMPLE_LABEL).toBe("Sample data · pre-sorted starting layout");
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run shared/sample-feedback.test.ts`
      Expected: FAIL — `Failed to resolve import "./sample-feedback"`

- [ ] **Step 3: Write the sample data (copy verbatim)**
      Create `shared/sample-feedback.ts`:
      ```ts
      /**
       * SAMPLE DATA — 200 synthetic customer comments for a fictional expenses app.
       * Loaded as a deliberately imperfect pre-sorted starting layout (spec D15).
       * `theme` is the intended theme, used only by tests; it is never shown to the agent.
       */
      export type SampleTheme =
        | "plan-billing" | "onboarding" | "mobile" | "bank-sync" | "export"
        | "notifications" | "feature-request" | "performance" | "praise";

      export const SAMPLE_LABEL = "Sample data · pre-sorted starting layout";

      export const SAMPLE_START_CLUSTERS = [
        "Onboarding & setup",
        "Mobile app",
        "Bank sync & imports",
        "Reports & exports",
        "Notifications",
        "Feature requests",
      ] as const;

      export type SampleStartCluster = (typeof SAMPLE_START_CLUSTERS)[number];

      export interface SampleFeedback {
        body: string;
        theme: SampleTheme;
        start: SampleStartCluster | null;
      }

      export const MONEY_SHOT_SEEDS = ["which plan am I even on?", "the billing page makes no sense"] as const;

      const ONB: SampleStartCluster = "Onboarding & setup";
      const MOB: SampleStartCluster = "Mobile app";
      const BNK: SampleStartCluster = "Bank sync & imports";
      const REP: SampleStartCluster = "Reports & exports";
      const NTF: SampleStartCluster = "Notifications";
      const FTR: SampleStartCluster = "Feature requests";

      export const SAMPLE_FEEDBACK: readonly SampleFeedback[] = [
        // Onboarding & setup (25): 22 onboarding + 3 misfiled plan/billing
        { body: "Setup wizard asked for my company size three times.", theme: "onboarding", start: ONB },
        { body: "Took me 20 minutes to figure out how to invite my accountant.", theme: "onboarding", start: ONB },
        { body: "The first-run checklist disappeared before I finished it.", theme: "onboarding", start: ONB },
        { body: "I couldn't tell which expense categories were created for me by default.", theme: "onboarding", start: ONB },
        { body: "Importing my old spreadsheet during setup failed with no error message.", theme: "onboarding", start: ONB },
        { body: "The onboarding video is great but it's for an older version of the app.", theme: "onboarding", start: ONB },
        { body: "Wish there was a sample company to play with before entering real data.", theme: "onboarding", start: ONB },
        { body: "Set up my team in ten minutes, then spent an hour trying to work out whether we're on Starter or Team.", theme: "plan-billing", start: ONB },
        { body: "Invite emails to my team landed in spam.", theme: "onboarding", start: ONB },
        { body: "Not obvious that I have to approve each teammate after they accept the invite.", theme: "onboarding", start: ONB },
        { body: "Setting up approval rules took way too many clicks.", theme: "onboarding", start: ONB },
        { body: "The tooltip tour covers buttons that don't exist on my screen.", theme: "onboarding", start: ONB },
        { body: "The welcome tour never explains what's included in my plan versus what costs extra.", theme: "plan-billing", start: ONB },
        { body: "Had to restart setup because I picked the wrong currency and couldn't change it.", theme: "onboarding", start: ONB },
        { body: "Couldn't skip the 'connect your bank' step even though I only want manual entry.", theme: "onboarding", start: ONB },
        { body: "Getting started guide links to a help page that 404s.", theme: "onboarding", start: ONB },
        { body: "It wasn't clear that receipts can be forwarded by email until a week in.", theme: "onboarding", start: ONB },
        { body: "My teammates got a different setup flow than I did, which confused everyone.", theme: "onboarding", start: ONB },
        { body: "During signup I picked monthly, but the confirmation email says annual. Which one am I paying for?", theme: "plan-billing", start: ONB },
        { body: "Please let me save setup halfway and come back later.", theme: "onboarding", start: ONB },
        { body: "The role names (Owner, Admin, Approver) aren't explained anywhere during setup.", theme: "onboarding", start: ONB },
        { body: "Spent ages looking for where to set our fiscal year start.", theme: "onboarding", start: ONB },
        { body: "Policy setup is powerful but the defaults are weird for a five-person team.", theme: "onboarding", start: ONB },
        { body: "Love the idea, but the first hour was rough.", theme: "onboarding", start: ONB },
        { body: "Onboarding asked me to upload a logo before I could do anything else. Why?", theme: "onboarding", start: ONB },

        // Mobile app (25): 23 mobile + 2 misfiled plan/billing
        { body: "The iPhone app crashes every time I open the camera to scan a receipt.", theme: "mobile", start: MOB },
        { body: "Android app logs me out every couple of days.", theme: "mobile", start: MOB },
        { body: "Receipt photos come out blurry unless I hold perfectly still.", theme: "mobile", start: MOB },
        { body: "Offline mode loses expenses I entered on the plane.", theme: "mobile", start: MOB },
        { body: "The app won't rotate to landscape on my tablet.", theme: "mobile", start: MOB },
        { body: "Dark mode on mobile makes the amount fields unreadable.", theme: "mobile", start: MOB },
        { body: "Uploading a multi-page receipt only keeps the first page.", theme: "mobile", start: MOB },
        { body: "The app shows a 'Pro' badge but my card was charged the Starter price. Very confusing.", theme: "plan-billing", start: MOB },
        { body: "The mobile app takes forever to open on older phones.", theme: "mobile", start: MOB },
        { body: "Can't edit an expense once it's submitted from my phone.", theme: "mobile", start: MOB },
        { body: "Tapping 'save' twice creates a duplicate expense.", theme: "mobile", start: MOB },
        { body: "The app crashed while I was filling a mileage claim and I lost everything.", theme: "mobile", start: MOB },
        { body: "Face ID unlock stopped working after the last update.", theme: "mobile", start: MOB },
        { body: "Mileage tracking drains my battery in an afternoon.", theme: "mobile", start: MOB },
        { body: "Can't find where to change my plan anywhere in the mobile app.", theme: "plan-billing", start: MOB },
        { body: "On Android the back button exits the app instead of going back a screen.", theme: "mobile", start: MOB },
        { body: "Push notifications open the app on the home screen, not on the expense they're about.", theme: "mobile", start: MOB },
        { body: "Scanning receipts in a dim restaurant is basically impossible.", theme: "mobile", start: MOB },
        { body: "The mobile keyboard covers the submit button on smaller phones.", theme: "mobile", start: MOB },
        { body: "I can't attach a PDF receipt from my email on mobile.", theme: "mobile", start: MOB },
        { body: "App update wiped my draft expenses.", theme: "mobile", start: MOB },
        { body: "Currency picker on mobile is a giant unsorted list.", theme: "mobile", start: MOB },
        { body: "Quick-add takes six taps on mobile; it should be one.", theme: "mobile", start: MOB },
        { body: "The app freezes when I switch between my two companies.", theme: "mobile", start: MOB },
        { body: "Pinch to zoom on receipt images doesn't work.", theme: "mobile", start: MOB },

        // Bank sync & imports (25): 23 bank-sync + 2 misfiled plan/billing
        { body: "My credit union disconnects every week and I have to log in again.", theme: "bank-sync", start: BNK },
        { body: "Bank transactions show up three days late.", theme: "bank-sync", start: BNK },
        { body: "Duplicate transactions after reconnecting my bank.", theme: "bank-sync", start: BNK },
        { body: "Card transactions are imported with the merchant name cut off.", theme: "bank-sync", start: BNK },
        { body: "Can't connect a business account that needs two-factor approval.", theme: "bank-sync", start: BNK },
        { body: "Some pending transactions never turn into posted ones.", theme: "bank-sync", start: BNK },
        { body: "My bank feed works fine, but I got charged twice this month and can't tell why from the invoice.", theme: "plan-billing", start: BNK },
        { body: "CSV bank import gets the date format wrong (day and month swapped).", theme: "bank-sync", start: BNK },
        { body: "Foreign currency transactions import with the wrong amount.", theme: "bank-sync", start: BNK },
        { body: "Bank sync silently stopped in March and I only noticed in May.", theme: "bank-sync", start: BNK },
        { body: "Matching receipts to card transactions misses obvious matches.", theme: "bank-sync", start: BNK },
        { body: "Refunds come in as new expenses instead of reducing the original.", theme: "bank-sync", start: BNK },
        { body: "Connecting a second card makes the first one stop syncing.", theme: "bank-sync", start: BNK },
        { body: "The bank list doesn't include my regional bank.", theme: "bank-sync", start: BNK },
        { body: "Connected a second bank account and suddenly my bill went up. Nothing warned me that costs more.", theme: "plan-billing", start: BNK },
        { body: "Imported transactions all land in 'Uncategorized'.", theme: "bank-sync", start: BNK },
        { body: "Splitting a bank transaction across two categories is impossible.", theme: "bank-sync", start: BNK },
        { body: "Reconnecting my bank asks me to re-categorize everything again.", theme: "bank-sync", start: BNK },
        { body: "Bank feed shows transfers between my own accounts as expenses.", theme: "bank-sync", start: BNK },
        { body: "OFX import fails with a cryptic error.", theme: "bank-sync", start: BNK },
        { body: "Transactions from my company card show the cardholder as 'Unknown'.", theme: "bank-sync", start: BNK },
        { body: "Sync button spins forever and nothing happens.", theme: "bank-sync", start: BNK },
        { body: "It imported two years of history when I only wanted this quarter.", theme: "bank-sync", start: BNK },
        { body: "Auto-categorization rules ignore the merchant I set them for.", theme: "bank-sync", start: BNK },
        { body: "My bank connection works on desktop but not in the mobile app.", theme: "bank-sync", start: BNK },

        // Reports & exports (25): 22 export + seed 2 + 2 misfiled plan/billing
        { body: "Monthly expense report PDF cuts off long descriptions.", theme: "export", start: REP },
        { body: "Exporting invoices to CSV drops the currency column.", theme: "export", start: REP },
        { body: "Our accountant needs an export her bookkeeping software accepts and we can't produce one.", theme: "export", start: REP },
        { body: "Report filters reset every time I leave the page.", theme: "export", start: REP },
        { body: "No way to export receipts as a single zip file.", theme: "export", start: REP },
        { body: "Expense report totals are off by a few cents due to rounding.", theme: "export", start: REP },
        { body: "the billing page makes no sense", theme: "plan-billing", start: REP },
        { body: "Scheduled reports arrive with last month's data.", theme: "export", start: REP },
        { body: "Can't group the report by project and category at the same time.", theme: "export", start: REP },
        { body: "The spreadsheet export opens with every number stored as text.", theme: "export", start: REP },
        { body: "Report builder is slow with more than 1,000 expenses.", theme: "export", start: REP },
        { body: "The invoice PDF lists three line items I don't recognise. What is 'seat proration'?", theme: "plan-billing", start: REP },
        { body: "Mileage doesn't show up in the expense report at all.", theme: "export", start: REP },
        { body: "Exported dates use the US format even though my account is set to UK.", theme: "export", start: REP },
        { body: "Would love the report to show who approved each expense.", theme: "export", start: REP },
        { body: "Tax summary report doesn't separate VAT.", theme: "export", start: REP },
        { body: "Shared report links expire after a day.", theme: "export", start: REP },
        { body: "Custom fields don't appear as columns in CSV exports.", theme: "export", start: REP },
        { body: "Exported my billing history to reconcile it and the totals don't match what was charged.", theme: "plan-billing", start: REP },
        { body: "Year-end export took 10 minutes and then failed.", theme: "export", start: REP },
        { body: "The report preview and the downloaded PDF don't match.", theme: "export", start: REP },
        { body: "Can't export just the expenses from one team.", theme: "export", start: REP },
        { body: "Receipt images in the PDF report are tiny and unreadable.", theme: "export", start: REP },
        { body: "Report says 'no data' for a month that clearly has expenses.", theme: "export", start: REP },
        { body: "Exports ignore the archived expenses we still need for audits.", theme: "export", start: REP },

        // Notifications (25): 20 notifications + 2 misfiled plan/billing + 1 onboarding + 1 mobile + 1 bank-sync
        { body: "Way too many emails. I get one for every single expense my team submits.", theme: "notifications", start: NTF },
        { body: "Can't turn off the daily digest without turning off approvals too.", theme: "notifications", start: NTF },
        { body: "Approval reminders go out at 3am my time.", theme: "notifications", start: NTF },
        { body: "Notification settings page doesn't save.", theme: "notifications", start: NTF },
        { body: "I miss approval requests because they're buried in the digest.", theme: "notifications", start: NTF },
        { body: "Got a 'payment failed' notification but my card is fine and the billing page says I'm paid up.", theme: "plan-billing", start: NTF },
        { body: "Chat alerts for approvals would be nice; email is too slow.", theme: "notifications", start: NTF },
        { body: "The bell icon shows a badge but the list is empty.", theme: "notifications", start: NTF },
        { body: "Reminder emails to submit expenses go to people who left the company.", theme: "notifications", start: NTF },
        { body: "The 'finish setting up your account' reminder keeps coming after I finished.", theme: "onboarding", start: NTF },
        { body: "Notifications don't say which company they're about when you have two.", theme: "notifications", start: NTF },
        { body: "Approvers get notified before the receipt finishes uploading.", theme: "notifications", start: NTF },
        { body: "Email notifications have broken images in my mail client.", theme: "notifications", start: NTF },
        { body: "Renewal reminder email says $96 but the app says $8 a month. Which is right?", theme: "plan-billing", start: NTF },
        { body: "Would like a weekly summary instead of instant alerts.", theme: "notifications", start: NTF },
        { body: "Got notified that an expense was rejected but not why.", theme: "notifications", start: NTF },
        { body: "Getting the same push notification three times on my phone.", theme: "mobile", start: NTF },
        { body: "Snoozing a reminder doesn't actually snooze it.", theme: "notifications", start: NTF },
        { body: "Too many 'tips and tricks' emails mixed in with real alerts.", theme: "notifications", start: NTF },
        { body: "No notification when my reimbursement is actually paid.", theme: "notifications", start: NTF },
        { body: "I get a 'bank connection lost' alert every morning even though sync works.", theme: "bank-sync", start: NTF },
        { body: "Notification emails link to the login page instead of the expense.", theme: "notifications", start: NTF },
        { body: "Can't mute notifications for one noisy project.", theme: "notifications", start: NTF },
        { body: "Team members don't get notified when I comment on their expense.", theme: "notifications", start: NTF },
        { body: "The unsubscribe link in reminder emails doesn't work.", theme: "notifications", start: NTF },

        // Feature requests (25): 22 feature-request + seed 1 + 1 misfiled plan/billing + 1 export
        { body: "Please add per-diem rates for business travel.", theme: "feature-request", start: FTR },
        { body: "Would love multi-level approvals for big purchases.", theme: "feature-request", start: FTR },
        { body: "Let us set budgets per project and warn when we're close.", theme: "feature-request", start: FTR },
        { body: "An API so we can push expenses from our own tools.", theme: "feature-request", start: FTR },
        { body: "Support for splitting one receipt between two people.", theme: "feature-request", start: FTR },
        { body: "which plan am I even on?", theme: "plan-billing", start: FTR },
        { body: "Recurring expenses (like a monthly phone bill) should auto-create.", theme: "feature-request", start: FTR },
        { body: "Please add a keyboard shortcut to approve and jump to the next expense.", theme: "feature-request", start: FTR },
        { body: "Custom approval rules based on category would save us hours.", theme: "feature-request", start: FTR },
        { body: "Bulk edit categories for a selection of expenses.", theme: "feature-request", start: FTR },
        { body: "Let me add notes to an expense that only approvers can see.", theme: "feature-request", start: FTR },
        { body: "Let me save a report layout so I don't rebuild it every month.", theme: "export", start: FTR },
        { body: "Mileage with a map route would be a great addition.", theme: "feature-request", start: FTR },
        { body: "Support for cash advances and reconciling them later.", theme: "feature-request", start: FTR },
        { body: "Tag expenses with clients so we can re-bill them.", theme: "feature-request", start: FTR },
        { body: "Please just show the price of each plan next to the features. Comparing them is impossible right now.", theme: "plan-billing", start: FTR },
        { body: "A proper audit log of who changed what.", theme: "feature-request", start: FTR },
        { body: "Let employees see the status of their reimbursement in one place.", theme: "feature-request", start: FTR },
        { body: "Spanish and Portuguese translations, please.", theme: "feature-request", start: FTR },
        { body: "Two-person rule for reimbursements over a threshold.", theme: "feature-request", start: FTR },
        { body: "Allow approvers to delegate while on holiday.", theme: "feature-request", start: FTR },
        { body: "Import expense categories from a file instead of typing them.", theme: "feature-request", start: FTR },
        { body: "Dark mode on the web app, please.", theme: "feature-request", start: FTR },
        { body: "Integrate with our calendar so trips create expense folders automatically.", theme: "feature-request", start: FTR },
        { body: "Let me duplicate last month's expense as a starting point.", theme: "feature-request", start: FTR },

        // Unsorted (50): 20 performance + 20 praise + 2 plan/billing + 3 onboarding + 2 mobile + 2 bank-sync + 1 export
        { body: "The dashboard takes 8 seconds to load every morning.", theme: "performance", start: null },
        { body: "Honestly the best expense tool we've tried. Receipts just work.", theme: "praise", start: null },
        { body: "Searching expenses is painfully slow.", theme: "performance", start: null },
        { body: "Love how quick it is to snap a receipt and move on.", theme: "praise", start: null },
        { body: "No idea where to start after creating the account. Blank screen, no hints.", theme: "onboarding", start: null },
        { body: "Approving a batch of 50 expenses times out.", theme: "performance", start: null },
        { body: "Support answered in ten minutes and fixed my issue. Amazing.", theme: "praise", start: null },
        { body: "The web app gets sluggish after an hour; I have to refresh.", theme: "performance", start: null },
        { body: "Upgraded to add a teammate and now I have no idea what I'll be charged next month.", theme: "plan-billing", start: null },
        { body: "Our finance team saves hours every month thanks to this.", theme: "praise", start: null },
        { body: "Uploading receipts is slow even on fast office wifi.", theme: "performance", start: null },
        { body: "Clean design, my team actually uses it.", theme: "praise", start: null },
        { body: "Since the update the Android app shows a white screen on launch.", theme: "mobile", start: null },
        { body: "Filtering by date range freezes the page.", theme: "performance", start: null },
        { body: "Approvals from my phone are a game changer.", theme: "praise", start: null },
        { body: "Opening an expense with many attachments takes forever.", theme: "performance", start: null },
        { body: "Switched from spreadsheets and never looking back.", theme: "praise", start: null },
        { body: "Transactions from my savings account appear in the expenses list.", theme: "bank-sync", start: null },
        { body: "The app is fast in the morning and crawls by afternoon.", theme: "performance", start: null },
        { body: "The auto-categorization is surprisingly accurate.", theme: "praise", start: null },
        { body: "Switching between tabs reloads everything from scratch.", theme: "performance", start: null },
        { body: "Reimbursements are faster than ever.", theme: "praise", start: null },
        { body: "Our admin left and nobody else can finish the workspace setup.", theme: "onboarding", start: null },
        { body: "Page scroll stutters on the expense list.", theme: "performance", start: null },
        { body: "Great product, small team, big impact for us.", theme: "praise", start: null },
        { body: "Login takes 15 seconds some days.", theme: "performance", start: null },
        { body: "Our accountant said getting set up was painless.", theme: "praise", start: null },
        { body: "Downgrading took me to a page full of legal text and no actual button.", theme: "plan-billing", start: null },
        { body: "Exporting anything blocks the whole app until it finishes.", theme: "performance", start: null },
        { body: "Really like the new receipt matching.", theme: "praise", start: null },
        { body: "Receipt scanner reads 7s as 1s on almost every receipt.", theme: "mobile", start: null },
        { body: "The category dropdown lags when we have lots of categories.", theme: "performance", start: null },
        { body: "The weekly summary email is genuinely useful.", theme: "praise", start: null },
        { body: "Saving an expense sometimes spins for half a minute.", theme: "performance", start: null },
        { body: "Five stars. Simple, fast, does the job.", theme: "praise", start: null },
        { body: "Can't remove an old bank connection; it keeps coming back.", theme: "bank-sync", start: null },
        { body: "Everything is slower since the redesign.", theme: "performance", start: null },
        { body: "My employees stopped complaining about expenses. That's a first.", theme: "praise", start: null },
        { body: "The approvals page loads all history instead of just pending items.", theme: "performance", start: null },
        { body: "The setup checklist says 4 of 5 done but won't tell me what's missing.", theme: "onboarding", start: null },
        { body: "The mobile app is smooth on my phone.", theme: "praise", start: null },
        { body: "Typing in the description box lags behind my keyboard.", theme: "performance", start: null },
        { body: "Love the policy warnings before I submit.", theme: "praise", start: null },
        { body: "Charts on the home page take ages and I never look at them.", theme: "performance", start: null },
        { body: "Downloaded report has a blank second page every time.", theme: "export", start: null },
        { body: "Exports made our audit painless this year.", theme: "praise", start: null },
        { body: "Receipt previews load one by one, very slowly.", theme: "performance", start: null },
        { body: "Best customer support I've dealt with in years.", theme: "praise", start: null },
        { body: "The app hangs when I paste a long description.", theme: "performance", start: null },
        { body: "It just works. Thank you!", theme: "praise", start: null },
      ];
      ```

- [ ] **Step 4: Run to confirm it passes (the gate)**
      Run: `pnpm vitest run shared/sample-feedback.test.ts`
      Expected: PASS — `Tests  5 passed (5)`

- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add 200 labeled sample comments with a pre-sorted starting layout`

---

### Task 15: CSV feedback parser

**Files:**
- Create: `server/lib/csv.ts`
- Test: `server/lib/csv.test.ts`

**Depends on:** Task 1
**Effort:** medium
**Provides:** `parseFeedbackCsv(input: string): string[]`
**Requires:** `@agent-native/core 0.226.0 chat-template app at repo root`

- [ ] **Step 1: Write the failing test**
      Create `server/lib/csv.test.ts`:
      ```ts
      import { describe, expect, it } from "vitest";

      import { MAX_BODY_CHARS, parseCsvRows, parseFeedbackCsv } from "./csv.js";

      describe("parseCsvRows", () => {
        it("handles quotes, escaped quotes, quoted commas and newlines, CRLF and a BOM", () => {
          const input = '﻿id,comment\r\n1,"Hello, world"\r\n2,"She said ""hi""\nthen left"\r\n';
          expect(parseCsvRows(input)).toEqual([
            ["id", "comment"],
            ["1", "Hello, world"],
            ["2", 'She said "hi"\nthen left'],
          ]);
        });
      });

      describe("parseFeedbackCsv", () => {
        it("uses a recognised header column and skips the header row", () => {
          expect(parseFeedbackCsv("source,Feedback\napp store,Too slow\nemail,  Love it  \n")).toEqual(["Too slow", "Love it"]);
        });

        it("accepts every documented header name", () => {
          for (const header of ["comment", "feedback", "text", "body", "note", "message"]) {
            expect(parseFeedbackCsv(`${header}\nA comment`)).toEqual(["A comment"]);
          }
        });

        it("falls back to the first column when there is no recognised header", () => {
          expect(parseFeedbackCsv("Crashes on login,ios\nGreat support,web")).toEqual(["Crashes on login", "Great support"]);
        });

        it("drops empty rows and empty bodies, and truncates long bodies", () => {
          const long = "x".repeat(MAX_BODY_CHARS + 50);
          expect(parseFeedbackCsv(`comment\n\n   \n"${long}"\n`)).toEqual(["x".repeat(MAX_BODY_CHARS)]);
          expect(parseFeedbackCsv("")).toEqual([]);
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run server/lib/csv.test.ts`
      Expected: FAIL — `Failed to resolve import "./csv.js"`

- [ ] **Step 3: Implement the parser**
      Create `server/lib/csv.ts`:
      ```ts
      export const BODY_HEADER_NAMES = ["comment", "feedback", "text", "body", "note", "message"] as const;
      export const MAX_BODY_CHARS = 1000;

      /** RFC 4180 rows: double-quoted fields, "" escapes, quoted commas/newlines, CRLF or LF, optional BOM. */
      export function parseCsvRows(input: string): string[][] {
        const text = input.startsWith("﻿") ? input.slice(1) : input;
        const rows: string[][] = [];
        let row: string[] = [];
        let field = "";
        let inQuotes = false;
        let i = 0;
        while (i < text.length) {
          const ch = text.charAt(i);
          if (inQuotes) {
            if (ch === '"') {
              if (text.charAt(i + 1) === '"') {
                field += '"';
                i += 2;
                continue;
              }
              inQuotes = false;
              i += 1;
              continue;
            }
            field += ch;
            i += 1;
            continue;
          }
          if (ch === '"') {
            inQuotes = true;
          } else if (ch === ",") {
            row.push(field);
            field = "";
          } else if (ch === "\n") {
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
          } else if (ch !== "\r") {
            field += ch;
          }
          i += 1;
        }
        if (field.length > 0 || row.length > 0) {
          row.push(field);
          rows.push(row);
        }
        return rows;
      }

      /** Comment bodies: the column named comment/feedback/text/body/note/message, else column 1. */
      export function parseFeedbackCsv(input: string): string[] {
        const rows = parseCsvRows(input).filter((r) => r.some((cell) => cell.trim().length > 0));
        const first = rows[0];
        if (!first) return [];
        const header = first.map((cell) => cell.trim().toLowerCase());
        const headerIndex = header.findIndex((cell) => (BODY_HEADER_NAMES as readonly string[]).includes(cell));
        const column = headerIndex >= 0 ? headerIndex : 0;
        const dataRows = headerIndex >= 0 ? rows.slice(1) : rows;
        const bodies: string[] = [];
        for (const r of dataRows) {
          const value = (r[column] ?? "").trim();
          if (value.length === 0) continue;
          bodies.push(value.length > MAX_BODY_CHARS ? value.slice(0, MAX_BODY_CHARS) : value);
        }
        return bodies;
      }
      ```

- [ ] **Step 4: Run to confirm it passes (the gate)**
      Run: `pnpm vitest run server/lib/csv.test.ts`
      Expected: PASS — `Tests  5 passed (5)`

- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add the RFC 4180 feedback CSV parser`

---

### Task 16: Board store (snapshot, positions, ownership)

**Files:**
- Create: `server/lib/board-store.ts`
- Test: `server/lib/board-store.test.ts`

**Depends on:** Task 2
**Effort:** medium
**Provides:** `loadBoard(ownerEmail: string): Promise<BoardSnapshot>`, `nextClusterPosition(ownerEmail: string): Promise<number>`, `frontClusterPosition(ownerEmail: string): Promise<number>`, `nextNotePosition(ownerEmail: string, clusterId: string | null): Promise<number>`, `getOwnedCluster(ownerEmail: string, clusterId: string): Promise<ClusterRow>`, `getOwnedClusters(ownerEmail: string, clusterIds: string[]): Promise<ClusterRow[]>`, `getOwnedNotes(ownerEmail: string, noteIds: string[]): Promise<NoteRow[]>`, `countNotes(ownerEmail: string): Promise<{ total: number; sample: number }>`, `clipText(text: string, max: number): string`
**Requires:** `getDb(): PgDatabase (typed with schema)`, `schema.stigiClusters`, `schema.stigiNotes`, `resetTestDb(): Promise<void>`, `type BoardSnapshot`

- [ ] **Step 1: Write the failing test**
      Create `server/lib/board-store.test.ts`:
      ```ts
      import { beforeEach, describe, expect, it } from "vitest";

      import { getDb, schema } from "../db/index.js";
      import { resetTestDb } from "../db/test-db.js";
      import {
        clipText, countNotes, frontClusterPosition, getOwnedCluster, getOwnedClusters, getOwnedNotes,
        loadBoard, nextClusterPosition, nextNotePosition,
      } from "./board-store.js";

      const ADA = "ada@stigi.test";
      const BOB = "bob@stigi.test";
      const now = "2026-11-09T10:00:00.000Z";

      async function cluster(id: string, owner: string, name: string | null, position: number) {
        await getDb().insert(schema.stigiClusters).values({ id, ownerEmail: owner, name, createdBy: "sample", position, createdAt: now, updatedAt: now });
      }
      async function note(id: string, owner: string, clusterId: string | null, position: number, source: "sample" | "import" = "sample") {
        await getDb().insert(schema.stigiNotes).values({ id, ownerEmail: owner, body: `note ${id}`, source, clusterId, reason: null, movedBy: null, movedAt: null, position, createdAt: now });
      }

      describe("board store", () => {
        beforeEach(async () => {
          await resetTestDb();
        });

        it("builds an ordered snapshot of the owner's board only", async () => {
          await cluster("c2", ADA, "Second", 1);
          await cluster("c1", ADA, "First", 0);
          await cluster("cb", BOB, "Bob's", 0);
          await note("n2", ADA, "c1", 1);
          await note("n1", ADA, "c1", 0);
          await note("u1", ADA, null, 0, "import");
          await note("orphan", ADA, "deleted-cluster", 0);
          await note("nb", BOB, "cb", 0);
          const board = await loadBoard(ADA);
          expect(board.clusters.map((c) => c.id)).toEqual(["c1", "c2"]);
          expect(board.clusters[0]?.notes.map((n) => n.id)).toEqual(["n1", "n2"]);
          expect(board.unsorted.map((n) => n.id).sort()).toEqual(["orphan", "u1"]);
          expect(board.totalNotes).toBe(4);
          expect(board.sampleNotes).toBe(3);
        });

        it("computes next and front positions", async () => {
          expect(await nextClusterPosition(ADA)).toBe(0);
          expect(await frontClusterPosition(ADA)).toBe(-1);
          await cluster("c1", ADA, "A", 0);
          await cluster("c2", ADA, "B", 3);
          expect(await nextClusterPosition(ADA)).toBe(4);
          expect(await frontClusterPosition(ADA)).toBe(-1);
          await note("n1", ADA, "c1", 5);
          expect(await nextNotePosition(ADA, "c1")).toBe(6);
          expect(await nextNotePosition(ADA, null)).toBe(0);
        });

        it("enforces ownership on lookups", async () => {
          await cluster("cb", BOB, "Bob's", 0);
          await note("nb", BOB, "cb", 0);
          await expect(getOwnedCluster(ADA, "cb")).rejects.toThrow(/Cluster not found/);
          await expect(getOwnedClusters(ADA, ["cb"])).rejects.toThrow(/Cluster not found/);
          await expect(getOwnedNotes(ADA, ["nb"])).rejects.toThrow(/Note not found/);
          expect((await getOwnedCluster(BOB, "cb")).name).toBe("Bob's");
          expect(await getOwnedNotes(BOB, [])).toEqual([]);
        });

        it("counts notes and clips text", async () => {
          await note("n1", ADA, null, 0, "sample");
          await note("n2", ADA, null, 1, "import");
          expect(await countNotes(ADA)).toEqual({ total: 2, sample: 1 });
          expect(clipText("  hello   world  ", 50)).toBe("hello world");
          expect(clipText("abcdefghij", 5)).toBe("abcd…");
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run server/lib/board-store.test.ts`
      Expected: FAIL — `Failed to resolve import "./board-store.js"`

- [ ] **Step 3: Implement the store**
      Create `server/lib/board-store.ts`:
      ```ts
      import { fail } from "@agent-native/core/action";
      import { and, asc, count, eq, inArray, isNull, max, min } from "drizzle-orm";

      import type { BoardCluster, BoardNote, BoardSnapshot } from "../../shared/board-types.js";
      import { getDb, schema } from "../db/index.js";

      export type NoteRow = typeof schema.stigiNotes.$inferSelect;
      export type ClusterRow = typeof schema.stigiClusters.$inferSelect;

      const notes = schema.stigiNotes;
      const clusters = schema.stigiClusters;

      export function toBoardNote(row: NoteRow): BoardNote {
        return {
          id: row.id, body: row.body, source: row.source, clusterId: row.clusterId,
          reason: row.reason, movedBy: row.movedBy, movedAt: row.movedAt, position: row.position,
        };
      }

      export function clipText(text: string, maxChars: number): string {
        const flat = text.replace(/\s+/g, " ").trim();
        return flat.length > maxChars ? `${flat.slice(0, maxChars - 1)}…` : flat;
      }

      export async function loadBoard(ownerEmail: string): Promise<BoardSnapshot> {
        const db = getDb();
        const clusterRows = await db.select().from(clusters).where(eq(clusters.ownerEmail, ownerEmail))
          .orderBy(asc(clusters.position), asc(clusters.createdAt));
        const noteRows = await db.select().from(notes).where(eq(notes.ownerEmail, ownerEmail))
          .orderBy(asc(notes.position), asc(notes.createdAt));
        const known = new Set(clusterRows.map((c) => c.id));
        const byCluster = new Map<string, BoardNote[]>();
        const unsorted: BoardNote[] = [];
        let sampleNotes = 0;
        for (const row of noteRows) {
          const note = toBoardNote(row);
          if (note.source === "sample") sampleNotes += 1;
          if (note.clusterId === null || !known.has(note.clusterId)) {
            unsorted.push(note);
            continue;
          }
          const list = byCluster.get(note.clusterId) ?? [];
          list.push(note);
          byCluster.set(note.clusterId, list);
        }
        const boardClusters: BoardCluster[] = clusterRows.map((c) => ({
          id: c.id, name: c.name, createdBy: c.createdBy, position: c.position, notes: byCluster.get(c.id) ?? [],
        }));
        return { clusters: boardClusters, unsorted, totalNotes: noteRows.length, sampleNotes };
      }

      export async function nextClusterPosition(ownerEmail: string): Promise<number> {
        const [row] = await getDb().select({ value: max(clusters.position) }).from(clusters).where(eq(clusters.ownerEmail, ownerEmail));
        return (row?.value ?? -1) + 1;
      }

      /** Newest-first: a new cluster goes in front so it is visible at the top of the grid. */
      export async function frontClusterPosition(ownerEmail: string): Promise<number> {
        const [row] = await getDb().select({ value: min(clusters.position) }).from(clusters).where(eq(clusters.ownerEmail, ownerEmail));
        return (row?.value ?? 0) - 1;
      }

      export async function nextNotePosition(ownerEmail: string, clusterId: string | null): Promise<number> {
        const where = clusterId === null
          ? and(eq(notes.ownerEmail, ownerEmail), isNull(notes.clusterId))
          : and(eq(notes.ownerEmail, ownerEmail), eq(notes.clusterId, clusterId));
        const [row] = await getDb().select({ value: max(notes.position) }).from(notes).where(where);
        return (row?.value ?? -1) + 1;
      }

      export async function getOwnedClusters(ownerEmail: string, clusterIds: string[]): Promise<ClusterRow[]> {
        const unique = [...new Set(clusterIds)];
        if (unique.length === 0) return [];
        const rows = await getDb().select().from(clusters)
          .where(and(eq(clusters.ownerEmail, ownerEmail), inArray(clusters.id, unique)));
        if (rows.length !== unique.length) {
          const found = new Set(rows.map((r) => r.id));
          const missing = unique.filter((id) => !found.has(id));
          fail(`Cluster not found: ${missing.join(", ")}`, { errorCode: "cluster_not_found", statusCode: 404 });
        }
        return rows;
      }

      export async function getOwnedCluster(ownerEmail: string, clusterId: string): Promise<ClusterRow> {
        const [row] = await getOwnedClusters(ownerEmail, [clusterId]);
        if (!row) fail(`Cluster not found: ${clusterId}`, { errorCode: "cluster_not_found", statusCode: 404 });
        return row;
      }

      export async function getOwnedNotes(ownerEmail: string, noteIds: string[]): Promise<NoteRow[]> {
        const unique = [...new Set(noteIds)];
        if (unique.length === 0) return [];
        const rows = await getDb().select().from(notes)
          .where(and(eq(notes.ownerEmail, ownerEmail), inArray(notes.id, unique)));
        if (rows.length !== unique.length) {
          const found = new Set(rows.map((r) => r.id));
          const missing = unique.filter((id) => !found.has(id));
          fail(`Note not found: ${missing.join(", ")}`, { errorCode: "note_not_found", statusCode: 404 });
        }
        return rows;
      }

      export async function countNotes(ownerEmail: string): Promise<{ total: number; sample: number }> {
        const rows = await getDb().select({ source: notes.source, value: count() }).from(notes)
          .where(eq(notes.ownerEmail, ownerEmail)).groupBy(notes.source);
        let total = 0;
        let sample = 0;
        for (const row of rows) {
          total += row.value;
          if (row.source === "sample") sample += row.value;
        }
        return { total, sample };
      }
      ```

- [ ] **Step 4: Run to confirm it passes (the gate)**
      Run: `pnpm vitest run server/lib/board-store.test.ts`
      Expected: PASS — `Tests  4 passed (4)`

- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add the board store (snapshot, positions, ownership checks)`

---

### Task 17: `import-notes` action (pre-sorted sample + CSV)

**Files:**
- Create: `actions/import-notes.ts`
- Test: `actions/import-notes.test.ts`

**Depends on:** Task 2, Task 14, Task 15, Task 16
**Effort:** medium
**Provides:** `action import-notes { csv?: string; sample?: boolean }`
**Requires:** `SAMPLE_FEEDBACK: readonly SampleFeedback[] (200 labeled sample notes)`, `SAMPLE_START_CLUSTERS (6 starting cluster names)`, `parseFeedbackCsv(input: string): string[]`, `countNotes(ownerEmail: string): Promise<{ total: number; sample: number }>`, `nextClusterPosition(ownerEmail: string): Promise<number>`, `nextNotePosition(ownerEmail: string, clusterId: string | null): Promise<number>`, `loadBoard(ownerEmail: string): Promise<BoardSnapshot>`, `requireOwner(ctx: OwnerContext | undefined): string`

Signatures used: `SAMPLE_START_CLUSTERS` is the readonly tuple `["Onboarding & setup","Mobile app","Bank sync & imports","Reports & exports","Notifications","Feature requests"]`; each `SAMPLE_FEEDBACK` item is `{ body: string; theme: SampleTheme; start: SampleStartCluster | null }`.

- [ ] **Step 1: Write the failing test**
      Create `actions/import-notes.test.ts`:
      ```ts
      import { beforeEach, describe, expect, it } from "vitest";

      import { resetTestDb } from "../server/db/test-db.js";
      import { loadBoard } from "../server/lib/board-store.js";
      import { SAMPLE_START_CLUSTERS } from "../shared/sample-feedback.js";
      import importNotes from "./import-notes.js";

      const user = { userEmail: "ada@stigi.test", caller: "frontend" as const };

      describe("import-notes", () => {
        beforeEach(async () => {
          await resetTestDb();
        });

        it("loads the labeled sample as a pre-sorted starting layout", async () => {
          const result = await importNotes.run({ sample: true }, user);
          expect(result).toMatchObject({ imported: 200, clustersCreated: 6 });
          expect(result.message).toContain("sample");
          const board = await loadBoard("ada@stigi.test");
          expect(board.clusters.map((c) => c.name)).toEqual([...SAMPLE_START_CLUSTERS]);
          expect(board.clusters.every((c) => c.createdBy === "sample" && c.notes.length === 25)).toBe(true);
          expect(board.unsorted).toHaveLength(50);
          expect(board.sampleNotes).toBe(200);
          const every = [...board.unsorted, ...board.clusters.flatMap((c) => c.notes)];
          expect(every.every((n) => n.source === "sample" && n.movedBy === null && n.reason === null)).toBe(true);
          const billing = board.clusters.find((c) => c.name === "Feature requests")?.notes.map((n) => n.body) ?? [];
          expect(billing).toContain("which plan am I even on?");
        });

        it("refuses to load the sample twice", async () => {
          await importNotes.run({ sample: true }, user);
          await expect(importNotes.run({ sample: true }, user)).rejects.toThrow(/already on your board/);
        });

        it("imports CSV comments into Unsorted", async () => {
          const result = await importNotes.run({ csv: "comment\nFirst\nSecond\n" }, user);
          expect(result).toMatchObject({ imported: 2, clustersCreated: 0 });
          const board = await loadBoard("ada@stigi.test");
          expect(board.unsorted.map((n) => n.body)).toEqual(["First", "Second"]);
          expect(board.unsorted.every((n) => n.source === "import")).toBe(true);
        });

        it("rejects empty CSV, oversize boards, missing input and anonymous callers", async () => {
          await expect(importNotes.run({ csv: "comment\n\n" }, user)).rejects.toThrow(/No comments found/);
          const big = `comment\n${Array.from({ length: 501 }, (_, i) => `c${i}`).join("\n")}`;
          await expect(importNotes.run({ csv: big }, user)).rejects.toThrow(/at most 500 notes/);
          await expect(importNotes.run({}, user)).rejects.toThrow(/either csv or sample/);
          await expect(importNotes.run({ sample: true }, { caller: "frontend" as const })).rejects.toThrow(/Sign in/);
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run actions/import-notes.test.ts`
      Expected: FAIL — `Failed to resolve import "./import-notes.js"`

- [ ] **Step 3: Implement the action**
      Create `actions/import-notes.ts`:
      ```ts
      import { defineAction, fail } from "@agent-native/core/action";
      import { z } from "zod";

      import { getDb, schema } from "../server/db/index.js";
      import { countNotes, nextClusterPosition, nextNotePosition } from "../server/lib/board-store.js";
      import { parseFeedbackCsv } from "../server/lib/csv.js";
      import { requireOwner } from "../server/lib/owner.js";
      import { MAX_BOARD_NOTES } from "../shared/board-types.js";
      import { SAMPLE_FEEDBACK, SAMPLE_START_CLUSTERS } from "../shared/sample-feedback.js";

      export default defineAction({
        description:
          "Import customer comments onto the board: the bundled 200-note SAMPLE DATA (synthetic, loaded as a pre-sorted starting layout) or CSV text into Unsorted. UI-only.",
        schema: z.object({
          csv: z.string().max(2_000_000).optional().describe("CSV text; the comment column is detected by header name, else column 1."),
          sample: z.boolean().optional().describe("true loads the bundled sample data."),
        }),
        agentTool: false,
        run: async (args, ctx) => {
          const owner = requireOwner(ctx);
          const counts = await countNotes(owner);
          const db = getDb();
          const now = new Date().toISOString();

          if (args.sample === true) {
            if (counts.sample > 0) {
              fail("Sample data is already on your board.", { errorCode: "sample_already_loaded", statusCode: 409 });
            }
            if (counts.total + SAMPLE_FEEDBACK.length > MAX_BOARD_NOTES) {
              fail(`A board holds at most ${MAX_BOARD_NOTES} notes.`, { errorCode: "too_many_notes", statusCode: 400 });
            }
            const firstPosition = await nextClusterPosition(owner);
            const clusterIds = new Map<string, string>();
            let offset = 0;
            for (const name of SAMPLE_START_CLUSTERS) {
              const id = crypto.randomUUID();
              clusterIds.set(name, id);
              await db.insert(schema.stigiClusters).values({
                id, ownerEmail: owner, name, createdBy: "sample",
                position: firstPosition + offset, createdAt: now, updatedAt: now,
              });
              offset += 1;
            }
            let unsortedPosition = await nextNotePosition(owner, null);
            const clusterPositions = new Map<string, number>();
            const rows = SAMPLE_FEEDBACK.map((item) => {
              const clusterId = item.start === null ? null : (clusterIds.get(item.start) ?? null);
              let position: number;
              if (clusterId === null) {
                position = unsortedPosition;
                unsortedPosition += 1;
              } else {
                position = clusterPositions.get(clusterId) ?? 0;
                clusterPositions.set(clusterId, position + 1);
              }
              return {
                id: crypto.randomUUID(), ownerEmail: owner, body: item.body, source: "sample" as const,
                clusterId, reason: null, movedBy: null, movedAt: null, position, createdAt: now,
              };
            });
            await db.insert(schema.stigiNotes).values(rows);
            return {
              id: "board",
              imported: rows.length,
              clustersCreated: SAMPLE_START_CLUSTERS.length,
              message: `Loaded ${rows.length} sample notes (pre-sorted starting layout).`,
            };
          }

          if (typeof args.csv === "string") {
            const bodies = parseFeedbackCsv(args.csv);
            if (bodies.length === 0) {
              fail("No comments found in that CSV.", { errorCode: "no_comments", statusCode: 400 });
            }
            if (counts.total + bodies.length > MAX_BOARD_NOTES) {
              fail(`A board holds at most ${MAX_BOARD_NOTES} notes; this import would make ${counts.total + bodies.length}.`, {
                errorCode: "too_many_notes", statusCode: 400,
              });
            }
            const start = await nextNotePosition(owner, null);
            const rows = bodies.map((body, index) => ({
              id: crypto.randomUUID(), ownerEmail: owner, body, source: "import" as const,
              clusterId: null, reason: null, movedBy: null, movedAt: null, position: start + index, createdAt: now,
            }));
            await db.insert(schema.stigiNotes).values(rows);
            return { id: "board", imported: rows.length, clustersCreated: 0, message: `Imported ${rows.length} notes into Unsorted.` };
          }

          return fail("Pass either csv or sample: true.", { errorCode: "invalid_input", statusCode: 400 });
        },
      });
      ```

- [ ] **Step 4: Run to confirm it passes (the gate)**
      Run: `pnpm vitest run actions/import-notes.test.ts`
      Expected: PASS — `Tests  4 passed (4)`

- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add import-notes (pre-sorted labeled sample and CSV)`

---

### Task 18: `get-board` action

**Files:**
- Create: `actions/get-board.ts`
- Test: `actions/get-board.test.ts`

**Depends on:** Task 2, Task 16, Task 17
**Effort:** low
**Provides:** `action get-board {} -> BoardSnapshot`
**Requires:** `loadBoard(ownerEmail: string): Promise<BoardSnapshot>`, `requireOwner(ctx: OwnerContext | undefined): string`, `action import-notes { csv?: string; sample?: boolean }`

- [ ] **Step 1: Write the failing test**
      Create `actions/get-board.test.ts`:
      ```ts
      import { beforeEach, describe, expect, it } from "vitest";

      import { resetTestDb } from "../server/db/test-db.js";
      import getBoard from "./get-board.js";
      import importNotes from "./import-notes.js";

      const ada = { userEmail: "ada@stigi.test", caller: "frontend" as const };
      const bob = { userEmail: "bob@stigi.test", caller: "frontend" as const };

      describe("get-board", () => {
        beforeEach(async () => {
          await resetTestDb();
        });

        it("returns an empty board for a new user", async () => {
          expect(await getBoard.run({}, ada)).toEqual({ clusters: [], unsorted: [], totalNotes: 0, sampleNotes: 0 });
        });

        it("returns only the caller's board", async () => {
          await importNotes.run({ sample: true }, ada);
          const adaBoard = await getBoard.run({}, ada);
          expect(adaBoard.totalNotes).toBe(200);
          expect(adaBoard.clusters).toHaveLength(6);
          expect((await getBoard.run({}, bob)).totalNotes).toBe(0);
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run actions/get-board.test.ts`
      Expected: FAIL — `Failed to resolve import "./get-board.js"`

- [ ] **Step 3: Implement the action**
      Create `actions/get-board.ts`:
      ```ts
      import { defineAction } from "@agent-native/core/action";
      import { z } from "zod";

      import { loadBoard } from "../server/lib/board-store.js";
      import { requireOwner } from "../server/lib/owner.js";

      export default defineAction({
        description: "Read the whole board (clusters with notes, plus Unsorted) for the UI. The agent uses view-screen and list-notes instead.",
        schema: z.object({}),
        http: { method: "GET" },
        readOnly: true,
        agentTool: false,
        run: async (_args, ctx) => loadBoard(requireOwner(ctx)),
      });
      ```

- [ ] **Step 4: Run to confirm it passes (the gate)**
      Run: `pnpm vitest run actions/get-board.test.ts`
      Expected: PASS — `Tests  2 passed (2)`

- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add the get-board read action`

---

### Task 19: `create-cluster` and `rename-cluster` actions

**Files:**
- Create: `actions/create-cluster.ts`
- Create: `actions/rename-cluster.ts`
- Test: `actions/create-cluster.test.ts`
- Test: `actions/rename-cluster.test.ts`

**Depends on:** Task 2, Task 16, Task 17
**Effort:** medium
**Provides:** `action create-cluster { name?: string; noteIds?: string[] } -> { id, name, message }`, `action rename-cluster { clusterId: string; name: string }`
**Requires:** `frontClusterPosition(ownerEmail: string): Promise<number>`, `getOwnedCluster(ownerEmail: string, clusterId: string): Promise<ClusterRow>`, `getOwnedNotes(ownerEmail: string, noteIds: string[]): Promise<NoteRow[]>`, `loadBoard(ownerEmail: string): Promise<BoardSnapshot>`, `requireOwner(ctx: OwnerContext | undefined): string`, `actorFromCtx(ctx: CallerContext | undefined): Actor`, `action import-notes { csv?: string; sample?: boolean }`

- [ ] **Step 1: Write the failing tests**
      Create `actions/create-cluster.test.ts`:
      ```ts
      import { beforeEach, describe, expect, it } from "vitest";

      import { resetTestDb } from "../server/db/test-db.js";
      import { loadBoard } from "../server/lib/board-store.js";
      import createCluster from "./create-cluster.js";
      import importNotes from "./import-notes.js";

      const user = { userEmail: "ada@stigi.test", caller: "frontend" as const };
      const agent = { userEmail: "ada@stigi.test", caller: "tool" as const };

      describe("create-cluster", () => {
        beforeEach(async () => {
          await resetTestDb();
          await importNotes.run({ csv: "comment\nA\nB\nC\n" }, user);
        });

        it("creates an untitled user cluster in front and moves the dragged notes into it", async () => {
          const before = await loadBoard("ada@stigi.test");
          const ids = before.unsorted.slice(0, 2).map((n) => n.id);
          const result = await createCluster.run({ noteIds: ids }, user);
          expect(result.name).toBeNull();
          expect(result.message).toContain("untitled");
          const board = await loadBoard("ada@stigi.test");
          const created = board.clusters[0];
          expect(created?.id).toBe(result.id);
          expect(created?.createdBy).toBe("user");
          expect(created?.notes.map((n) => n.id)).toEqual(ids);
          expect(created?.notes.every((n) => n.movedBy === "user" && n.reason === null)).toBe(true);
          expect(board.unsorted).toHaveLength(1);
        });

        it("lets the agent create an empty named cluster but not move notes without reasons", async () => {
          const named = await createCluster.run({ name: "Performance" }, agent);
          expect(named.name).toBe("Performance");
          const board = await loadBoard("ada@stigi.test");
          expect(board.clusters.find((c) => c.id === named.id)?.createdBy).toBe("agent");
          const noteId = board.unsorted[0]?.id ?? "";
          await expect(createCluster.run({ name: "X", noteIds: [noteId] }, agent)).rejects.toThrow(/move-notes/);
        });

        it("puts each new cluster in front of the previous ones", async () => {
          const first = await createCluster.run({ name: "First" }, user);
          const second = await createCluster.run({ name: "Second" }, user);
          const board = await loadBoard("ada@stigi.test");
          expect(board.clusters.map((c) => c.id)).toEqual([second.id, first.id]);
        });

        it("rejects notes the caller does not own", async () => {
          await expect(createCluster.run({ noteIds: ["nope"] }, user)).rejects.toThrow(/Note not found/);
        });
      });
      ```
      Create `actions/rename-cluster.test.ts`:
      ```ts
      import { beforeEach, describe, expect, it } from "vitest";

      import { resetTestDb } from "../server/db/test-db.js";
      import { loadBoard } from "../server/lib/board-store.js";
      import createCluster from "./create-cluster.js";
      import renameCluster from "./rename-cluster.js";

      const user = { userEmail: "ada@stigi.test", caller: "frontend" as const };
      const agent = { userEmail: "ada@stigi.test", caller: "tool" as const };
      const bob = { userEmail: "bob@stigi.test", caller: "frontend" as const };

      describe("rename-cluster", () => {
        beforeEach(async () => {
          await resetTestDb();
        });

        it("renames an owned cluster (agent or user)", async () => {
          const created = await createCluster.run({}, user);
          const result = await renameCluster.run({ clusterId: created.id, name: "Plan & billing confusion" }, agent);
          expect(result).toMatchObject({ id: created.id, name: "Plan & billing confusion" });
          const board = await loadBoard("ada@stigi.test");
          expect(board.clusters[0]?.name).toBe("Plan & billing confusion");
        });

        it("refuses another user's cluster", async () => {
          const created = await createCluster.run({}, user);
          await expect(renameCluster.run({ clusterId: created.id, name: "Mine" }, bob)).rejects.toThrow(/Cluster not found/);
        });
      });
      ```

- [ ] **Step 2: Run to confirm they fail**
      Run: `pnpm vitest run actions/create-cluster.test.ts actions/rename-cluster.test.ts`
      Expected: FAIL — `Failed to resolve import "./create-cluster.js"`

- [ ] **Step 3: Implement both actions**
      Create `actions/create-cluster.ts`:
      ```ts
      import { defineAction, fail } from "@agent-native/core/action";
      import { and, eq } from "drizzle-orm";
      import { z } from "zod";

      import { getDb, schema } from "../server/db/index.js";
      import { frontClusterPosition, getOwnedNotes } from "../server/lib/board-store.js";
      import { actorFromCtx } from "../server/lib/caller.js";
      import { requireOwner } from "../server/lib/owner.js";
      import { MAX_CLUSTER_NAME_CHARS, MAX_MOVES_PER_CALL } from "../shared/board-types.js";

      export default defineAction({
        description:
          "Create a cluster (theme) on the board, optionally named. The agent creates EMPTY named clusters and then fills them with move-notes so every move has a reason; the UI passes noteIds when the user drags notes onto 'New cluster'.",
        schema: z.object({
          name: z.string().trim().min(1).max(MAX_CLUSTER_NAME_CHARS).optional().describe("2–4 word theme name; omit for an untitled cluster."),
          noteIds: z.array(z.string().min(1)).max(MAX_MOVES_PER_CALL).optional().describe("UI only: notes the user dropped into the new cluster."),
        }),
        run: async (args, ctx) => {
          const owner = requireOwner(ctx);
          const actor = actorFromCtx(ctx);
          const noteIds = args.noteIds ?? [];
          if (actor === "agent" && noteIds.length > 0) {
            fail("Create the cluster empty, then use move-notes so each move carries a reason.", {
              errorCode: "agent_move_requires_reason", statusCode: 400,
            });
          }
          await getOwnedNotes(owner, noteIds);
          const db = getDb();
          const id = crypto.randomUUID();
          const now = new Date().toISOString();
          const name = args.name ?? null;
          await db.insert(schema.stigiClusters).values({
            id, ownerEmail: owner, name, createdBy: actor,
            position: await frontClusterPosition(owner), createdAt: now, updatedAt: now,
          });
          let position = 0;
          for (const noteId of noteIds) {
            await db.update(schema.stigiNotes)
              .set({ clusterId: id, reason: null, movedBy: "user", movedAt: now, position })
              .where(and(eq(schema.stigiNotes.ownerEmail, owner), eq(schema.stigiNotes.id, noteId)));
            position += 1;
          }
          return { id, name, message: name ? `Created cluster "${name}".` : "Created an untitled cluster." };
        },
      });
      ```
      Create `actions/rename-cluster.ts`:
      ```ts
      import { defineAction } from "@agent-native/core/action";
      import { and, eq } from "drizzle-orm";
      import { z } from "zod";

      import { getDb, schema } from "../server/db/index.js";
      import { getOwnedCluster } from "../server/lib/board-store.js";
      import { requireOwner } from "../server/lib/owner.js";
      import { MAX_CLUSTER_NAME_CHARS } from "../shared/board-types.js";

      export default defineAction({
        description: "Rename a cluster. Use a 2–4 word theme name that describes what its notes share.",
        schema: z.object({
          clusterId: z.string().min(1).describe("The cluster to rename."),
          name: z.string().trim().min(1).max(MAX_CLUSTER_NAME_CHARS).describe("New theme name, 2–4 words."),
        }),
        run: async ({ clusterId, name }, ctx) => {
          const owner = requireOwner(ctx);
          await getOwnedCluster(owner, clusterId);
          await getDb().update(schema.stigiClusters)
            .set({ name, updatedAt: new Date().toISOString() })
            .where(and(eq(schema.stigiClusters.ownerEmail, owner), eq(schema.stigiClusters.id, clusterId)));
          return { id: clusterId, name, message: `Renamed the cluster to "${name}".` };
        },
      });
      ```

- [ ] **Step 4: Run to confirm they pass (the gate)**
      Run: `pnpm vitest run actions/create-cluster.test.ts actions/rename-cluster.test.ts`
      Expected: PASS — `Test Files  2 passed (2)`

- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add create-cluster (newest first) and rename-cluster actions`

---

### Task 20: `move-notes` action (reasons required for the agent)

**Files:**
- Create: `actions/move-notes.ts`
- Test: `actions/move-notes.test.ts`

**Depends on:** Task 2, Task 16, Task 17, Task 19
**Effort:** medium
**Provides:** `action move-notes { moves: { noteId: string; clusterId: string | null; reason?: string }[] }`
**Requires:** `getOwnedNotes(ownerEmail: string, noteIds: string[]): Promise<NoteRow[]>`, `getOwnedClusters(ownerEmail: string, clusterIds: string[]): Promise<ClusterRow[]>`, `nextNotePosition(ownerEmail: string, clusterId: string | null): Promise<number>`, `loadBoard(ownerEmail: string): Promise<BoardSnapshot>`, `requireOwner(ctx: OwnerContext | undefined): string`, `actorFromCtx(ctx: CallerContext | undefined): Actor`, `action create-cluster { name?: string; noteIds?: string[] } -> { id, name, message }`, `action import-notes { csv?: string; sample?: boolean }`

- [ ] **Step 1: Write the failing test**
      Create `actions/move-notes.test.ts`:
      ```ts
      import { beforeEach, describe, expect, it } from "vitest";

      import { resetTestDb } from "../server/db/test-db.js";
      import { loadBoard } from "../server/lib/board-store.js";
      import createCluster from "./create-cluster.js";
      import importNotes from "./import-notes.js";
      import moveNotes from "./move-notes.js";

      const OWNER = "ada@stigi.test";
      const user = { userEmail: OWNER, caller: "frontend" as const };
      const agent = { userEmail: OWNER, caller: "tool" as const };

      async function setup() {
        await importNotes.run({ csv: "comment\nA\nB\nC\nD\n" }, user);
        const target = await createCluster.run({ name: "Theme" }, user);
        const board = await loadBoard(OWNER);
        return { target: target.id, ids: board.unsorted.map((n) => n.id) };
      }

      describe("move-notes", () => {
        beforeEach(async () => {
          await resetTestDb();
        });

        it("records agent moves with their one-line reasons, appended to the target", async () => {
          const { target, ids } = await setup();
          const result = await moveNotes.run({
            moves: [
              { noteId: ids[0] ?? "", clusterId: target, reason: "Unsure which plan they are on" },
              { noteId: ids[1] ?? "", clusterId: target, reason: "  Confused by the billing page  " },
            ],
          }, agent);
          expect(result.moved).toBe(2);
          const notes = (await loadBoard(OWNER)).clusters[0]?.notes ?? [];
          expect(notes.map((n) => n.reason)).toEqual(["Unsure which plan they are on", "Confused by the billing page"]);
          expect(notes.every((n) => n.movedBy === "agent" && n.movedAt !== null)).toBe(true);
          expect(notes.map((n) => n.position)).toEqual([0, 1]);
        });

        it("rejects agent moves into a cluster without a reason", async () => {
          const { target, ids } = await setup();
          await expect(moveNotes.run({ moves: [{ noteId: ids[0] ?? "", clusterId: target }] }, agent)).rejects.toThrow(/one-line reason/);
          await expect(moveNotes.run({ moves: [{ noteId: ids[0] ?? "", clusterId: target, reason: "   " }] }, agent)).rejects.toThrow(/one-line reason/);
        });

        it("records user moves without reasons and clears an earlier agent reason", async () => {
          const { target, ids } = await setup();
          const noteId = ids[0] ?? "";
          await moveNotes.run({ moves: [{ noteId, clusterId: target, reason: "Agent thought so" }] }, agent);
          await moveNotes.run({ moves: [{ noteId, clusterId: null, reason: "ignored for users" }] }, user);
          const back = (await loadBoard(OWNER)).unsorted.find((n) => n.id === noteId);
          expect(back).toMatchObject({ clusterId: null, reason: null, movedBy: "user" });
        });

        it("rejects duplicates and unknown notes or clusters", async () => {
          const { target, ids } = await setup();
          const noteId = ids[0] ?? "";
          await expect(moveNotes.run({ moves: [{ noteId, clusterId: target }, { noteId, clusterId: null }] }, user)).rejects.toThrow(/only once/);
          await expect(moveNotes.run({ moves: [{ noteId: "nope", clusterId: target }] }, user)).rejects.toThrow(/Note not found/);
          await expect(moveNotes.run({ moves: [{ noteId, clusterId: "nope" }] }, user)).rejects.toThrow(/Cluster not found/);
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run actions/move-notes.test.ts`
      Expected: FAIL — `Failed to resolve import "./move-notes.js"`

- [ ] **Step 3: Implement the action**
      Create `actions/move-notes.ts`:
      ```ts
      import { defineAction, fail } from "@agent-native/core/action";
      import { and, eq } from "drizzle-orm";
      import { z } from "zod";

      import { getDb, schema } from "../server/db/index.js";
      import { getOwnedClusters, getOwnedNotes, nextNotePosition } from "../server/lib/board-store.js";
      import { actorFromCtx } from "../server/lib/caller.js";
      import { requireOwner } from "../server/lib/owner.js";
      import { MAX_MOVES_PER_CALL, MAX_REASON_CHARS } from "../shared/board-types.js";

      const UNSORTED_KEY = "__unsorted__";

      export default defineAction({
        description:
          "Move notes between clusters (clusterId null = Unsorted). Batch up to 50 moves in ONE call. When you (the agent) move a note into a cluster, give a one-line reason (aim ≤ 80 characters) naming the shared trait.",
        schema: z.object({
          moves: z.array(z.object({
            noteId: z.string().min(1).describe("The note to move."),
            clusterId: z.string().min(1).nullable().describe("Target cluster id, or null for Unsorted."),
            reason: z.string().max(MAX_REASON_CHARS).optional().describe("One-line reason; required for agent moves into a cluster."),
          })).min(1).max(MAX_MOVES_PER_CALL),
        }),
        run: async ({ moves }, ctx) => {
          const owner = requireOwner(ctx);
          const actor = actorFromCtx(ctx);
          const noteIds = moves.map((m) => m.noteId);
          if (new Set(noteIds).size !== noteIds.length) {
            fail("Each note can appear only once per call.", { errorCode: "invalid_input", statusCode: 400 });
          }
          if (actor === "agent") {
            for (const move of moves) {
              if (move.clusterId !== null && !move.reason?.trim()) {
                fail(`Every agent move into a cluster needs a one-line reason (missing for note ${move.noteId}).`, {
                  errorCode: "reason_required", statusCode: 400,
                });
              }
            }
          }
          await getOwnedNotes(owner, noteIds);
          await getOwnedClusters(owner, moves.flatMap((m) => (m.clusterId === null ? [] : [m.clusterId])));
          const db = getDb();
          const now = new Date().toISOString();
          const nextPositions = new Map<string, number>();
          for (const move of moves) {
            const key = move.clusterId ?? UNSORTED_KEY;
            const position = nextPositions.get(key) ?? (await nextNotePosition(owner, move.clusterId));
            nextPositions.set(key, position + 1);
            const reason = actor === "agent" && move.clusterId !== null ? (move.reason ?? "").trim() : null;
            await db.update(schema.stigiNotes)
              .set({ clusterId: move.clusterId, reason, movedBy: actor, movedAt: now, position })
              .where(and(eq(schema.stigiNotes.ownerEmail, owner), eq(schema.stigiNotes.id, move.noteId)));
          }
          return { id: "move-notes", moved: moves.length, message: `Moved ${moves.length} note${moves.length === 1 ? "" : "s"}.` };
        },
      });
      ```

- [ ] **Step 4: Run to confirm it passes (the gate)**
      Run: `pnpm vitest run actions/move-notes.test.ts`
      Expected: PASS — `Tests  4 passed (4)`

- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add move-notes with required agent reasons`

---

### Task 21: `list-notes` action (the agent's compact read)

**Files:**
- Create: `actions/list-notes.ts`
- Test: `actions/list-notes.test.ts`

**Depends on:** Task 2, Task 16, Task 17, Task 19
**Effort:** medium
**Provides:** `action list-notes { scope, clusterId?, limit, offset } -> { total, notes: { id, text, cluster }[], nextOffset }`
**Requires:** `getOwnedCluster(ownerEmail: string, clusterId: string): Promise<ClusterRow>`, `clipText(text: string, max: number): string`, `requireOwner(ctx: OwnerContext | undefined): string`, `action import-notes { csv?: string; sample?: boolean }`, `action create-cluster { name?: string; noteIds?: string[] } -> { id, name, message }`

- [ ] **Step 1: Write the failing test**
      Create `actions/list-notes.test.ts`:
      ```ts
      import { beforeEach, describe, expect, it } from "vitest";

      import { resetTestDb } from "../server/db/test-db.js";
      import { loadBoard } from "../server/lib/board-store.js";
      import createCluster from "./create-cluster.js";
      import importNotes from "./import-notes.js";
      import listNotes from "./list-notes.js";

      const OWNER = "ada@stigi.test";
      const user = { userEmail: OWNER, caller: "frontend" as const };
      const agent = { userEmail: OWNER, caller: "tool" as const };

      describe("list-notes", () => {
        beforeEach(async () => {
          await resetTestDb();
          await importNotes.run({ sample: true }, user);
        });

        it("pages through unsorted notes compactly", async () => {
          const first = await listNotes.run({ scope: "unsorted", limit: 25, offset: 0 }, agent);
          expect(first.total).toBe(50);
          expect(first.notes).toHaveLength(25);
          expect(first.nextOffset).toBe(25);
          expect(first.notes[0]).toEqual({ id: expect.any(String), text: expect.any(String), cluster: null });
          const second = await listNotes.run({ scope: "unsorted", limit: 25, offset: 25 }, agent);
          expect(second.nextOffset).toBeNull();
        });

        it("lists every note outside one cluster with cluster names, including Unsorted", async () => {
          const board = await loadBoard(OWNER);
          const seeds = board.unsorted.slice(0, 2).map((n) => n.id);
          const taught = await createCluster.run({ noteIds: seeds }, user);
          const outside = await listNotes.run({ scope: "outside-cluster", clusterId: taught.id, limit: 250, offset: 0 }, agent);
          expect(outside.total).toBe(198);
          expect(outside.notes.some((n) => seeds.includes(n.id))).toBe(false);
          expect(outside.notes.some((n) => n.cluster === "Mobile app")).toBe(true);
          expect(outside.notes.some((n) => n.cluster === null)).toBe(true);
        });

        it("requires an owned clusterId for outside-cluster", async () => {
          await expect(listNotes.run({ scope: "outside-cluster", limit: 10, offset: 0 }, agent)).rejects.toThrow(/needs clusterId/);
          await expect(listNotes.run({ scope: "outside-cluster", clusterId: "nope", limit: 10, offset: 0 }, agent)).rejects.toThrow(/Cluster not found/);
        });

        it("lists all notes", async () => {
          expect((await listNotes.run({ scope: "all", limit: 5, offset: 0 }, agent)).total).toBe(200);
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run actions/list-notes.test.ts`
      Expected: FAIL — `Failed to resolve import "./list-notes.js"`

- [ ] **Step 3: Implement the action**
      Create `actions/list-notes.ts`:
      ```ts
      import { defineAction, fail } from "@agent-native/core/action";
      import { and, asc, count, eq, isNull, ne, or, type SQL } from "drizzle-orm";
      import { z } from "zod";

      import { getDb, schema } from "../server/db/index.js";
      import { clipText, getOwnedCluster } from "../server/lib/board-store.js";
      import { requireOwner } from "../server/lib/owner.js";
      import { UNTITLED_LABEL } from "../shared/board-types.js";

      export default defineAction({
        description:
          "List notes compactly (id, text ≤ 200 chars, current cluster name). scope 'unsorted' for sorting batches, 'outside-cluster' (with clusterId) to find notes that belong in a cluster you are teaching, 'all' for everything.",
        schema: z.object({
          scope: z.enum(["unsorted", "all", "outside-cluster"]).describe("Which notes to list."),
          clusterId: z.string().min(1).optional().describe("Required for scope 'outside-cluster'."),
          limit: z.coerce.number().int().min(1).max(250).default(60).describe("Page size (1–250)."),
          offset: z.coerce.number().int().min(0).default(0).describe("Page start."),
        }),
        http: { method: "GET" },
        readOnly: true,
        run: async (args, ctx) => {
          const owner = requireOwner(ctx);
          const notes = schema.stigiNotes;
          let where: SQL | undefined;
          if (args.scope === "unsorted") {
            where = and(eq(notes.ownerEmail, owner), isNull(notes.clusterId));
          } else if (args.scope === "outside-cluster") {
            const clusterId = args.clusterId;
            if (!clusterId) fail("Scope 'outside-cluster' needs clusterId.", { errorCode: "invalid_input", statusCode: 400 });
            await getOwnedCluster(owner, clusterId);
            where = and(eq(notes.ownerEmail, owner), or(isNull(notes.clusterId), ne(notes.clusterId, clusterId)));
          } else {
            where = eq(notes.ownerEmail, owner);
          }
          const db = getDb();
          const [totalRow] = await db.select({ value: count() }).from(notes).where(where);
          const total = totalRow?.value ?? 0;
          const rows = await db.select().from(notes).where(where)
            .orderBy(asc(notes.position), asc(notes.createdAt)).limit(args.limit).offset(args.offset);
          const clusterRows = await db.select({ id: schema.stigiClusters.id, name: schema.stigiClusters.name })
            .from(schema.stigiClusters).where(eq(schema.stigiClusters.ownerEmail, owner));
          const names = new Map<string, string>(clusterRows.map((c) => [c.id, c.name ?? UNTITLED_LABEL]));
          const end = args.offset + rows.length;
          return {
            total,
            notes: rows.map((r) => ({
              id: r.id,
              text: clipText(r.body, 200),
              cluster: r.clusterId === null ? null : (names.get(r.clusterId) ?? UNTITLED_LABEL),
            })),
            nextOffset: end < total ? end : null,
            message: `${rows.length} of ${total} notes.`,
          };
        },
      });
      ```

- [ ] **Step 4: Run to confirm it passes (the gate)**
      Run: `pnpm vitest run actions/list-notes.test.ts`
      Expected: PASS — `Tests  4 passed (4)`

- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add the agent's compact list-notes action`

---

### Task 22: `view-screen` — the agent's eyes on the board

**Files:**
- Modify: `actions/view-screen.ts`
- Test: `actions/view-screen.test.ts`

**Depends on:** Task 2, Task 16, Task 17, Task 18
**Effort:** medium
**Provides:** `action view-screen {} -> { navigation, selection, board, selectedNotes, selectedCluster }`
**Requires:** `loadBoard(ownerEmail: string): Promise<BoardSnapshot>`, `clipText(text: string, max: number): string`, `requireOwner(ctx: OwnerContext | undefined): string`, `action import-notes { csv?: string; sample?: boolean }`, `action get-board {} -> BoardSnapshot`

Upstream framework signature used: `readAppStateForCurrentTab(key: string, options?: { fallbackToGlobal?: boolean }): Promise<Record<string, unknown> | null>` from `@agent-native/core/application-state` (reads the requesting browser tab's key, then the global key; the framework's tasks template reads view state the same way). The UI writes `selection = { kind: "stigi.board", noteIds: string[], clusterId: string | null, capturedAt: string }` (Task 31).

- [ ] **Step 1: Write the failing test**
      Create `actions/view-screen.test.ts`:
      ```ts
      import { beforeEach, describe, expect, it, vi } from "vitest";

      const { readAppStateForCurrentTab } = vi.hoisted(() => ({ readAppStateForCurrentTab: vi.fn() }));
      vi.mock("@agent-native/core/application-state", () => ({ readAppStateForCurrentTab }));

      import { resetTestDb } from "../server/db/test-db.js";
      import getBoard from "./get-board.js";
      import importNotes from "./import-notes.js";
      import viewScreen from "./view-screen.js";

      const user = { userEmail: "ada@stigi.test", caller: "frontend" as const };
      const agent = { userEmail: "ada@stigi.test", caller: "tool" as const };

      describe("view-screen", () => {
        beforeEach(async () => {
          await resetTestDb();
          readAppStateForCurrentTab.mockReset();
          await importNotes.run({ sample: true }, user);
        });

        it("returns navigation, selection, a board summary and the selected notes and cluster", async () => {
          const board = await getBoard.run({}, user);
          const cluster = board.clusters[1];
          const picked = (cluster?.notes ?? []).slice(0, 2).map((n) => n.id);
          readAppStateForCurrentTab.mockImplementation(async (key: string) => {
            if (key === "navigation") return { view: "board", path: "/board" };
            if (key === "selection") return { kind: "stigi.board", noteIds: picked, clusterId: cluster?.id ?? null, capturedAt: "2026-11-09T10:00:00Z" };
            return null;
          });
          const screen = await viewScreen.run({}, agent);
          expect(screen.navigation).toEqual({ view: "board", path: "/board" });
          expect(screen.board.clusters).toHaveLength(6);
          expect(screen.board.clusters[1]).toEqual({ id: cluster?.id, name: "Mobile app", noteCount: 25, createdBy: "sample" });
          expect(screen.board.unsortedCount).toBe(50);
          expect(screen.board.sampleNotes).toBe(200);
          expect(screen.selectedNotes.map((n) => n.id)).toEqual(picked);
          expect(screen.selectedNotes[0]?.cluster).toBe("Mobile app");
          expect(screen.selectedCluster?.name).toBe("Mobile app");
          expect(screen.selectedCluster?.notes).toHaveLength(20);
        });

        it("ignores selection state of another kind", async () => {
          readAppStateForCurrentTab.mockImplementation(async (key: string) => (key === "selection" ? { kind: "other", noteIds: ["x"] } : null));
          const screen = await viewScreen.run({}, agent);
          expect(screen.selection).toBeNull();
          expect(screen.selectedNotes).toEqual([]);
          expect(screen.selectedCluster).toBeNull();
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run actions/view-screen.test.ts`
      Expected: FAIL — `Cannot read properties of undefined (reading 'clusters')` (the template action returns only navigation)

- [ ] **Step 3: Replace the template action**
      Replace the whole of `actions/view-screen.ts` with:
      ```ts
      import { defineAction } from "@agent-native/core/action";
      import { readAppStateForCurrentTab } from "@agent-native/core/application-state";
      import { z } from "zod";

      import { clipText, loadBoard } from "../server/lib/board-store.js";
      import { requireOwner } from "../server/lib/owner.js";
      import { UNTITLED_LABEL, type BoardNote } from "../shared/board-types.js";

      interface BoardSelection {
        noteIds: string[];
        clusterId: string | null;
      }

      function parseSelection(value: Record<string, unknown> | null): BoardSelection | null {
        if (!value || value.kind !== "stigi.board") return null;
        const noteIds = Array.isArray(value.noteIds)
          ? value.noteIds.filter((id): id is string => typeof id === "string")
          : [];
        const clusterId = typeof value.clusterId === "string" ? value.clusterId : null;
        return { noteIds, clusterId };
      }

      export default defineAction({
        description:
          "See what the user sees: navigation (board or report), the selection they made, cluster ids/names/counts and the selected notes or cluster. Call this before acting on what the user is looking at.",
        schema: z.object({}),
        http: false,
        readOnly: true,
        run: async (_args, ctx) => {
          const owner = requireOwner(ctx);
          const navigation = await readAppStateForCurrentTab("navigation", { fallbackToGlobal: true });
          const selection = parseSelection(await readAppStateForCurrentTab("selection", { fallbackToGlobal: true }));
          const board = await loadBoard(owner);
          const names = new Map<string, string>(board.clusters.map((c) => [c.id, c.name ?? UNTITLED_LABEL]));
          const every: BoardNote[] = [...board.unsorted, ...board.clusters.flatMap((c) => c.notes)];
          const compact = (n: BoardNote) => ({
            id: n.id,
            text: clipText(n.body, 200),
            cluster: n.clusterId === null ? null : (names.get(n.clusterId) ?? UNTITLED_LABEL),
          });
          const selectedIds = new Set(selection?.noteIds ?? []);
          const selectedClusterRow = selection?.clusterId
            ? board.clusters.find((c) => c.id === selection.clusterId)
            : undefined;
          return {
            navigation,
            selection,
            board: {
              clusters: board.clusters.map((c) => ({
                id: c.id, name: c.name ?? UNTITLED_LABEL, noteCount: c.notes.length, createdBy: c.createdBy,
              })),
              unsortedCount: board.unsorted.length,
              totalNotes: board.totalNotes,
              sampleNotes: board.sampleNotes,
            },
            selectedNotes: every.filter((n) => selectedIds.has(n.id)).slice(0, 20).map(compact),
            selectedCluster: selectedClusterRow
              ? {
                  id: selectedClusterRow.id,
                  name: selectedClusterRow.name ?? UNTITLED_LABEL,
                  notes: selectedClusterRow.notes.slice(0, 20).map((n) => ({ id: n.id, text: clipText(n.body, 200) })),
                }
              : null,
          };
        },
      });
      ```

- [ ] **Step 4: Run to confirm it passes (the gate)**
      Run: `pnpm vitest run actions/view-screen.test.ts`
      Expected: PASS — `Tests  2 passed (2)`

- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
      Message: `feat: extend view-screen with board, selection and selected notes`

---

### Task 23: Daily agent-turn cap and `get-agent-usage`

**Files:**
- Create: `shared/agent-limits.ts`
- Create: `server/lib/agent-usage.ts`
- Create: `actions/get-agent-usage.ts`
- Test: `server/lib/agent-usage.test.ts`

**Depends on:** Task 2
**Effort:** high
**Model tier:** top
**Provides:** `guardAgentTurn(details: { ownerEmail: string | null; internalContinuation: boolean }, now?: Date): Promise<void>`, `readAgentUsage(ownerEmail: string, now?: Date): Promise<AgentUsage>`, `dailyLimitMessage(limit: number): string`, `DEFAULT_DAILY_AGENT_TURNS = 40`, `action get-agent-usage {} -> AgentUsage & { id, message }`
**Requires:** `getDb(): PgDatabase (typed with schema)`, `schema.stigiAgentTurns`, `resetTestDb(): Promise<void>`, `requireOwner(ctx: OwnerContext | undefined): string`, `type AgentUsage`

Security-sensitive (public URL spends the user's money). Upstream h3 signature: `new HTTPError(message: string, details?: { status?: number; statusText?: string; data?: unknown })`.

- [ ] **Step 1: Write the failing test**
      Create `server/lib/agent-usage.test.ts`:
      ```ts
      import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

      import getAgentUsage from "../../actions/get-agent-usage.js";
      import { dailyLimitMessage } from "../../shared/agent-limits.js";
      import { resetTestDb } from "../db/test-db.js";
      import { dailyAgentTurnLimit, guardAgentTurn, readAgentUsage, utcDay } from "./agent-usage.js";

      const OWNER = "ada@stigi.test";
      const NOON = new Date("2026-11-09T12:00:00Z");
      const NEXT_DAY = new Date("2026-11-10T00:30:00Z");

      describe("daily agent-turn cap", () => {
        beforeEach(async () => {
          await resetTestDb();
          vi.stubEnv("STIGI_DAILY_AGENT_TURNS", "3");
        });
        afterEach(() => {
          vi.unstubAllEnvs();
        });

        it("parses the limit with a default of 40", () => {
          expect(dailyAgentTurnLimit({})).toBe(40);
          expect(dailyAgentTurnLimit({ STIGI_DAILY_AGENT_TURNS: "7" })).toBe(7);
          expect(dailyAgentTurnLimit({ STIGI_DAILY_AGENT_TURNS: "zero" })).toBe(40);
          expect(dailyAgentTurnLimit({ STIGI_DAILY_AGENT_TURNS: "-2" })).toBe(40);
          expect(utcDay(NOON)).toBe("2026-11-09");
        });

        it("refuses the turn over the limit with a friendly 429", async () => {
          for (let i = 0; i < 3; i += 1) await guardAgentTurn({ ownerEmail: OWNER, internalContinuation: false }, NOON);
          const error = await guardAgentTurn({ ownerEmail: OWNER, internalContinuation: false }, NOON).catch((e: unknown) => e);
          expect(error).toBeInstanceOf(Error);
          expect((error as { status?: number }).status).toBe(429);
          expect((error as Error).message).toBe(dailyLimitMessage(3));
          expect((error as Error).message).toContain("Demo credits for today are used");
        });

        it("counts neither continuations nor anonymous requests", async () => {
          for (let i = 0; i < 5; i += 1) await guardAgentTurn({ ownerEmail: OWNER, internalContinuation: true }, NOON);
          await guardAgentTurn({ ownerEmail: null, internalContinuation: false }, NOON);
          expect((await readAgentUsage(OWNER, NOON)).used).toBe(0);
        });

        it("reports usage and resets at the next UTC midnight", async () => {
          for (let i = 0; i < 3; i += 1) await guardAgentTurn({ ownerEmail: OWNER, internalContinuation: false }, NOON);
          expect(await readAgentUsage(OWNER, NOON)).toEqual({ used: 3, limit: 3, remaining: 0, resetsAt: "2026-11-10T00:00:00.000Z" });
          expect((await readAgentUsage(OWNER, NEXT_DAY)).remaining).toBe(3);
        });

        it("get-agent-usage returns the signed-in user's usage", async () => {
          const result = await getAgentUsage.run({}, { userEmail: OWNER, caller: "frontend" as const });
          expect(result).toMatchObject({ used: 0, limit: 3, remaining: 3 });
          expect(result.message).toBe("3 of 3 agent turns left today.");
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run server/lib/agent-usage.test.ts`
      Expected: FAIL — `Failed to resolve import "../../actions/get-agent-usage.js"`

- [ ] **Step 3: Implement the message, the library and the action**
      Create `shared/agent-limits.ts`:
      ```ts
      export const DEFAULT_DAILY_AGENT_TURNS = 40;

      /** Shown by the server's 429 and by the UI banner/toast (spec §11, D11). */
      export function dailyLimitMessage(limit: number): string {
        return `Demo credits for today are used: each account gets ${limit} agent turns per day. Your board is saved, and dragging, editing and exporting still work. Agent turns reset at 00:00 UTC.`;
      }
      ```
      Create `server/lib/agent-usage.ts`:
      ```ts
      import { and, eq, sql } from "drizzle-orm";
      import { HTTPError } from "h3";

      import { DEFAULT_DAILY_AGENT_TURNS, dailyLimitMessage } from "../../shared/agent-limits.js";
      import type { AgentUsage } from "../../shared/board-types.js";
      import { getDb, schema } from "../db/index.js";

      const turns = schema.stigiAgentTurns;

      export function utcDay(now: Date): string {
        return now.toISOString().slice(0, 10);
      }

      export function nextUtcMidnight(now: Date): string {
        return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();
      }

      export function dailyAgentTurnLimit(env: { STIGI_DAILY_AGENT_TURNS?: string | undefined } = process.env): number {
        const raw = env.STIGI_DAILY_AGENT_TURNS?.trim();
        const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
        return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_AGENT_TURNS;
      }

      export async function readAgentUsage(ownerEmail: string, now: Date = new Date()): Promise<AgentUsage> {
        const limit = dailyAgentTurnLimit();
        const [row] = await getDb().select({ count: turns.count }).from(turns)
          .where(and(eq(turns.ownerEmail, ownerEmail), eq(turns.day, utcDay(now))));
        const used = row?.count ?? 0;
        return { used: Math.min(used, limit), limit, remaining: Math.max(limit - used, 0), resetsAt: nextUtcMidnight(now) };
      }

      /** Atomic upsert: returns today's count after counting this turn. */
      export async function incrementAgentTurns(ownerEmail: string, now: Date = new Date()): Promise<number> {
        const [row] = await getDb().insert(turns)
          .values({ ownerEmail, day: utcDay(now), count: 1 })
          .onConflictDoUpdate({ target: [turns.ownerEmail, turns.day], set: { count: sql`${turns.count} + 1` } })
          .returning({ count: turns.count });
        return row?.count ?? 1;
      }

      /** Called from the agent-chat plugin's prepareRequest for every new (non-continuation) turn. */
      export async function guardAgentTurn(
        details: { ownerEmail: string | null; internalContinuation: boolean },
        now: Date = new Date(),
      ): Promise<void> {
        if (details.internalContinuation || !details.ownerEmail) return;
        const count = await incrementAgentTurns(details.ownerEmail, now);
        const limit = dailyAgentTurnLimit();
        if (count > limit) {
          throw new HTTPError(dailyLimitMessage(limit), {
            status: 429,
            statusText: "Too Many Requests",
            data: { code: "daily_agent_limit", limit },
          });
        }
      }
      ```
      Create `actions/get-agent-usage.ts`:
      ```ts
      import { defineAction } from "@agent-native/core/action";
      import { z } from "zod";

      import { readAgentUsage } from "../server/lib/agent-usage.js";
      import { requireOwner } from "../server/lib/owner.js";

      export default defineAction({
        description: "Today's agent-turn usage for the signed-in user (UI only).",
        schema: z.object({}),
        http: { method: "GET" },
        readOnly: true,
        agentTool: false,
        run: async (_args, ctx) => {
          const usage = await readAgentUsage(requireOwner(ctx));
          return { id: "agent-usage", ...usage, message: `${usage.remaining} of ${usage.limit} agent turns left today.` };
        },
      });
      ```

- [ ] **Step 4: Run to confirm it passes (the gate)**
      Run: `pnpm vitest run server/lib/agent-usage.test.ts`
      Expected: PASS — `Tests  5 passed (5)`

- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add the per-user daily agent-turn cap and get-agent-usage`

---

### Task 24: Agent-chat plugin — Stigi system prompt, starter tools and the cap guard

**Files:**
- Modify: `server/plugins/agent-chat.ts`

**Depends on:** Task 20, Task 21, Task 22, Task 23
**Effort:** high
**Model tier:** top
**Provides:** `agent-chat plugin: Stigi system prompt, INITIAL_TOOL_NAMES, prepareRequest daily-cap guard`
**Requires:** `guardAgentTurn(details: { ownerEmail: string | null; internalContinuation: boolean }, now?: Date): Promise<void>`, `action move-notes { moves: { noteId: string; clusterId: string | null; reason?: string }[] }`, `action list-notes { scope, clusterId?, limit, offset } -> { total, notes: { id, text, cluster }[], nextOffset }`, `action view-screen {} -> { navigation, selection, board, selectedNotes, selectedCluster }`

Security-sensitive: this is where the daily cap is enforced for every agent turn, including turns typed directly into chat. Framework signature used: `prepareRequest?: (details: { event: any; ownerEmail: string | null; references: AgentChatReference[]; internalContinuation?: boolean; … }) => void | PreparedAgentRequest | Promise<…>`. Keep `appId: "chat"` (template rule).

- [ ] **Step 1: Replace the plugin**
      Replace the whole of `server/plugins/agent-chat.ts` with:
      ```ts
      import { getOrgContext } from "@agent-native/core/org";
      import {
        createAgentChatPlugin,
        loadActionsFromStaticRegistry,
      } from "@agent-native/core/server";

      import actionsRegistry from "../../.generated/actions-registry.js";
      import { guardAgentTurn } from "../lib/agent-usage.js";
      import {
        searchConversationReferences,
        validateConversationReferences,
      } from "../lib/composer-references.js";

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

      export const STIGI_SYSTEM_PROMPT = `You are Stigi's sorting agent: you organize customer feedback notes on the user's board into themes using the board actions, and every move you make carries a one-line reason.

      Stigi is an Agent-Native app: the board UI and you share the same actions and data, so your moves appear on the user's board live. Follow AGENTS.md and the teach-cluster, sort-feedback and write-report skills. Keep every turn to one small batch of tool calls and a one-line reply. Sample notes are synthetic sample data; say so when you mention them.`;

      export default createAgentChatPlugin({
        appId: "chat",
        mentionProviders: {
          chats: {
            label: "composerSources.group",
            search: searchConversationReferences,
          },
        },
        prepareRequest: async ({ references, ownerEmail, internalContinuation }) => {
          await validateConversationReferences(references);
          await guardAgentTurn({ ownerEmail, internalContinuation: internalContinuation === true });
        },
        actions: loadActionsFromStaticRegistry(actionsRegistry),
        mcp: { connectorCatalog: [], appApprovalPage: true },
        initialToolNames: INITIAL_TOOL_NAMES,
        resolveOrgId: async (event) => (await getOrgContext(event)).orgId,
        systemPrompt: STIGI_SYSTEM_PROMPT,
      });
      ```

- [ ] **Step 2: Typecheck (the gate)**
      Run: `pnpm typecheck && echo AGENT_PLUGIN_OK`
      Expected: `AGENT_PLUGIN_OK`

- [ ] **Step 3: Commit (kernel-performed — no agent runs this)**
      Message: `feat: give the agent Stigi's system prompt, starter tools and the daily-cap guard`

---

### Task 25: `AGENTS.md` Stigi section and the `teach-cluster` skill

**Files:**
- Modify: `AGENTS.md`
- Create: `.agents/skills/teach-cluster/SKILL.md`
- Test: `server/lib/agent-instructions.test.ts`

**Depends on:** Task 1
**Effort:** medium
**Provides:** `AGENTS.md Stigi section`, `.agents/skills/teach-cluster/SKILL.md`
**Requires:** `@agent-native/core 0.226.0 chat-template app at repo root`

- [ ] **Step 1: Write the failing test**
      Create `server/lib/agent-instructions.test.ts`:
      ```ts
      import { readFileSync } from "node:fs";

      import { describe, expect, it } from "vitest";

      describe("agent instructions", () => {
        it("AGENTS.md carries the Stigi section with its invariants", () => {
          const agents = readFileSync("AGENTS.md", "utf8");
          expect(agents).toContain("## Stigi — feedback board agent");
          expect(agents).toContain("one-line reason");
          expect(agents).toContain("sample data");
          expect(agents).toContain("`teach-cluster`");
        });

        it("the teach-cluster skill is one short turn with one move-notes call", () => {
          const skill = readFileSync(".agents/skills/teach-cluster/SKILL.md", "utf8");
          expect(skill.startsWith("---\nname: teach-cluster\n")).toBe(true);
          expect(skill).toContain("rename-cluster");
          expect(skill).toContain('scope: "outside-cluster"');
          expect(skill).toContain("move-notes");
          expect(skill).toContain("ONCE");
          expect(skill).toContain("At most 20");
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run server/lib/agent-instructions.test.ts`
      Expected: FAIL — `expected '…' to contain '## Stigi — feedback board agent'`

- [ ] **Step 3: Append the Stigi section to `AGENTS.md`**
      Append to the end of `AGENTS.md` (keep everything above it):
      ```markdown

      ## Stigi — feedback board agent

      Stigi is a feedback board. Customer comments are **notes**; notes live in **clusters** (themes) or in
      **Unsorted**. The user and you change the board through the same actions, so your moves appear on
      their screen live.

      ### Invariants
      - Every note you move into a cluster carries a one-line reason (aim for 80 characters or fewer);
        `move-notes` rejects agent moves without one.
      - At most 50 moves per `move-notes` call, and one batch per turn: sort ≤ 25 notes, teach ≤ 20 moves.
      - Call `view-screen` before acting on what the user is looking at (navigation, selection, cluster
        ids and names, selected notes or cluster).
      - Create clusters empty with `create-cluster { name }`, then fill them with `move-notes`.
      - Never invent, edit or delete notes. You cannot reset the board or import data.
      - Sample notes are synthetic sample data for a fictional expenses app; always call them sample data.
      - Keep each turn short: a few tool calls, then a one-line reply. The app sends the next batch itself.

      ### Actions
      - Read: `view-screen`, `list-notes`, `get-board-digest`, `get-report`.
      - Write: `create-cluster`, `rename-cluster`, `move-notes`, `merge-clusters`, `save-report`, `navigate`.

      ### Skills
      - `teach-cluster` — the user put seed notes together (or asked for "more like these").
      - `sort-feedback` — sort one batch of unsorted notes.
      - `write-report` — write the insight report.
      ```

- [ ] **Step 4: Write the teach-cluster skill**
      Create `.agents/skills/teach-cluster/SKILL.md`:
      ```markdown
      ---
      name: teach-cluster
      description: Use when the user drags notes into a new cluster or asks for "more like these" — name the cluster from its seed notes and move every clearly matching note into it, each with a one-line reason, in one short turn.
      ---

      # Teach cluster

      The user taught you a theme by putting seed notes together. Generalize it in ONE short turn.

      1. Read the request context: `clusterId=<id>` and the seed notes. If the context is missing, call
         `view-screen` and use `selectedCluster` (or the cluster the user names).
      2. Decide the seeds' shared theme in 2–4 words (for example "Plan & billing confusion") and call
         `rename-cluster` with `{ clusterId, name }`.
      3. Call `list-notes` once with `{ scope: "outside-cluster", clusterId, limit: 250, offset: 0 }`.
      4. Pick the notes that clearly share the seeds' theme, wherever they are now. Precision over recall:
         skip anything ambiguous. At most 20.
      5. Call `move-notes` ONCE with all picks: `{ moves: [{ noteId, clusterId, reason }] }`. Each reason is
         one line (aim for 80 characters or fewer) naming the shared trait, e.g. "Unsure which plan they're on".
      6. Reply with one line: `Named "<name>" and moved <n> notes.` Then stop.

      Rules: never invent notes; never move a seed out of the cluster; never call `move-notes` more than
      once; never rename other clusters; sample notes are synthetic sample data — call them that.
      ```

- [ ] **Step 5: Run to confirm it passes (the gate)**
      Run: `pnpm vitest run server/lib/agent-instructions.test.ts`
      Expected: PASS — `Tests  2 passed (2)`

- [ ] **Step 6: Commit (kernel-performed — no agent runs this)**
      Message: `feat: teach the agent Stigi's invariants and the teach-cluster skill`

---

### Task 26: UI dependencies and the design tokens / board stylesheet

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `app/styles/stigi-tokens.css`
- Create: `app/styles/board.css`
- Test: `app/styles/styles.test.ts`

**Depends on:** Task 1
**Effort:** low
**Provides:** `app/styles/stigi-tokens.css (olive-on-bone, Host Grotesk + JetBrains Mono, scoped .stigi-route/.stigi)`, `app/styles/board.css`, `deps: @dnd-kit/core 6.3.1, motion 14.10.1, @testing-library/react 16.3.3, @testing-library/dom 10.4.2`
**Requires:** `@agent-native/core 0.226.0 chat-template app at repo root`

UI task: applies `docs/design/frontend.md` — the deal from `docs/design/frontend-kit/scripts/start.mjs` (palette `olive-on-bone`, type `host`, radius `soft`), the kit's spacing/type/radius scale (`docs/design/frontend-kit/assets/system.css`), the motion rules (`references/motion.md`: 2 px card lift, button step/press, rest under reduced motion), one button style pair, one card style, no violet. Tokens are scoped to `.stigi-route, .stigi` so the template shell is not restyled.

- [ ] **Step 1: Add the UI and component-test dependencies**
      Run: `pnpm add --save-exact @dnd-kit/core@6.3.1 motion@14.10.1 && pnpm add -D --save-exact @testing-library/react@16.3.3 @testing-library/dom@10.4.2`
      Expected: `dependencies: + @dnd-kit/core 6.3.1 + motion 14.10.1` and `devDependencies: + @testing-library/dom 10.4.2 + @testing-library/react 16.3.3`

- [ ] **Step 2: Write the failing test**
      Create `app/styles/styles.test.ts`:
      ```ts
      import { readFileSync } from "node:fs";

      import { describe, expect, it } from "vitest";

      const tokens = readFileSync("app/styles/stigi-tokens.css", "utf8");
      const board = readFileSync("app/styles/board.css", "utf8");

      describe("Stigi styles", () => {
        it("carries the dealt olive-on-bone palette and Host Grotesk + JetBrains Mono", () => {
          expect(tokens).toContain(".stigi-route,");
          expect(tokens).toContain("--p-bg: #ecebe7;");
          expect(tokens).toContain("--p-ink: #38450f;");
          expect(tokens).toContain('--font-display: "Host Grotesk"');
          expect(tokens).toContain('--font-mono: "JetBrains Mono"');
          expect(tokens).toContain("--r-btn: 8px;");
        });

        it("uses tokens, one button pair, the hover lift and a reduced-motion rest state", () => {
          expect(board).toContain(".stigi-btn--primary");
          expect(board).toContain(".stigi-btn--secondary");
          expect(board).toContain("translateY(-2px)");
          expect(board).toContain("@media (prefers-reduced-motion: reduce)");
          expect(board).toContain('[data-highlighted="true"]');
        });

        it("contains no violet", () => {
          for (const css of [tokens, board]) {
            expect(css.toLowerCase()).not.toMatch(/#(8b5cf6|7c3aed|a78bfa|6d28d9|c4b5fd|ddd6fe)|violet|lavender/);
          }
        });
      });
      ```

- [ ] **Step 3: Run to confirm it fails**
      Run: `pnpm vitest run app/styles/styles.test.ts`
      Expected: FAIL — `ENOENT: no such file or directory, open 'app/styles/stigi-tokens.css'`

- [ ] **Step 4: Write the tokens**
      Create `app/styles/stigi-tokens.css`:
      ```css
      /* Stigi tokens — values printed by docs/design/frontend-kit/scripts/start.mjs
         (deal 2026-11-09: palette olive-on-bone, type host, radius soft). Scoped to the board route so the
         template shell keeps its own styles. Spacing, type and radius scales from the kit's system.css. */
      .stigi-route,
      .stigi {
        --p-bg: #ecebe7; --p-surface: #e1dfd9; --p-ink: #38450f; --p-muted: #5a6537;
        --p-accent: #38450f; --p-accent-ink: #ecebe7; --p-action: #38450f; --p-action-ink: #ecebe7;
        --p-inv-bg: #38450f; --p-inv-surface: #435020; --p-inv-ink: #ecebe7; --p-inv-muted: #bbbfaf;
        --font-display: "Host Grotesk", system-ui, sans-serif;
        --font-text: "Host Grotesk", system-ui, sans-serif;
        --font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
        --display-weight: 500;
        --display-tracking: -0.035em;
        --t-label: 13px; --t-small: 14px; --t-body: 16px; --t-card: 18px; --t-h3: 24px;
        --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-5: 24px; --s-6: 32px;
        --r-sm: 8px; --r-md: 12px; --r-lg: 20px; --r-btn: 8px;
        --btn-h: 44px; --btn-h-sm: 36px;
        --ease: cubic-bezier(.2, .7, .2, 1);
        --dur: 180ms;
      }
      ```

- [ ] **Step 5: Write the board stylesheet**
      Create `app/styles/board.css`:
      ```css
      /* Stigi board — docs/design/frontend.md applied to an app: tokens only (stigi-tokens.css), one button
         pair, one card style, the kit's hover lift / press, nothing moves on scroll, rest under reduced motion. */
      .stigi-route { display: flex; height: 100%; min-height: 0; background: var(--p-bg); }
      .stigi {
        flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: var(--s-4);
        padding: var(--s-5); background: var(--p-bg); color: var(--p-ink);
        font-family: var(--font-text); font-size: var(--t-body); line-height: 1.45; overflow: auto;
      }
      .stigi h1, .stigi h2, .stigi-report h2 {
        font-family: var(--font-display); font-weight: var(--display-weight);
        letter-spacing: var(--display-tracking); margin: 0;
      }
      .stigi-topbar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-3) var(--s-4); }
      .stigi-topbar__title { font-size: var(--t-h3); }
      .stigi-topbar__actions { margin-left: auto; display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-2); }
      .stigi-chip {
        display: inline-flex; align-items: center; height: 28px; padding: 0 var(--s-3);
        border: 1px solid var(--p-ink); border-radius: 999px; font-family: var(--font-mono); font-size: var(--t-label);
      }
      .stigi-meta { color: var(--p-muted); font-size: var(--t-small); }
      .stigi-pill {
        display: inline-flex; align-items: center; gap: var(--s-2); height: 28px; padding: 0 var(--s-3);
        border-radius: 999px; background: var(--p-inv-bg); color: var(--p-inv-ink); font-size: var(--t-label);
      }
      .stigi-banner {
        margin: 0; padding: var(--s-3) var(--s-4); border-radius: var(--r-md);
        background: var(--p-inv-bg); color: var(--p-inv-ink); font-size: var(--t-small);
      }
      .stigi-btn {
        height: var(--btn-h-sm); padding: 0 var(--s-4); border-radius: var(--r-btn);
        font: 500 var(--t-small)/1 var(--font-text); cursor: pointer;
        transition: background-color var(--dur) var(--ease), transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
      }
      .stigi-btn--primary { background: var(--p-action); color: var(--p-action-ink); border: 1px solid var(--p-action); }
      .stigi-btn--primary:hover:not(:disabled) { background: var(--p-inv-surface); }
      .stigi-btn--secondary { background: var(--p-bg); color: var(--p-ink); border: 1px solid var(--p-ink); }
      .stigi-btn--secondary:hover:not(:disabled) { background: var(--p-surface); }
      .stigi-btn:active:not(:disabled) { transform: scale(.98); }
      .stigi-btn:disabled { opacity: .45; cursor: not-allowed; }
      .stigi-link {
        background: none; border: 0; padding: 0; color: var(--p-ink); font: inherit;
        text-decoration: underline; text-underline-offset: 3px; cursor: pointer;
      }
      .stigi-btn:focus-visible, .stigi-link:focus-visible, .stigi-note:focus-visible, .stigi-menu__item:focus-visible {
        outline: 2px solid var(--p-accent); outline-offset: 2px;
      }
      .stigi-switch { display: inline-flex; align-items: center; gap: var(--s-2); font-size: var(--t-small); }
      .stigi-switch input { accent-color: var(--p-accent); width: 16px; height: 16px; }

      .stigi-board { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: var(--s-4); align-items: start; }
      .stigi-rail { position: sticky; top: 0; display: flex; flex-direction: column; gap: var(--s-4); }
      .stigi-clusters { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: var(--s-4); align-items: start; }
      .stigi-column {
        display: flex; flex-direction: column; min-width: 0; padding: var(--s-3);
        background: var(--p-surface); border: 1px solid transparent; border-radius: var(--r-lg);
        transition: border-color var(--dur) var(--ease);
      }
      .stigi-column[data-over="true"] { border-color: var(--p-accent); }
      .stigi-column__header { position: relative; display: flex; align-items: center; gap: var(--s-2); padding: var(--s-1) var(--s-1) var(--s-3); }
      .stigi-column__title { flex: 1 1 auto; font-size: var(--t-card); }
      .stigi-column__title--untitled { font-style: italic; color: var(--p-muted); font-size: var(--t-small); }
      .stigi-column__count { font-family: var(--font-mono); font-size: var(--t-label); color: var(--p-muted); }
      .stigi-column__notes { display: flex; flex-direction: column; gap: var(--s-2); max-height: 480px; overflow-y: auto; padding: 2px; }

      .stigi-note {
        padding: var(--s-3); background: var(--p-bg); border-radius: var(--r-md);
        box-shadow: 0 1px 0 rgba(56, 69, 15, .12); cursor: grab; touch-action: none;
        transition: transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease), opacity var(--dur) var(--ease);
      }
      .stigi-note:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(56, 69, 15, .14); }
      .stigi-note[data-selected="true"] { box-shadow: 0 0 0 2px var(--p-accent); }
      .stigi-note[data-highlighted="true"] { box-shadow: 0 0 0 2px var(--p-accent), 0 0 0 6px rgba(56, 69, 15, .18); }
      .stigi-note[data-dragging="true"] { opacity: .35; }
      .stigi-note--overlay { cursor: grabbing; box-shadow: 0 12px 28px rgba(56, 69, 15, .25); }
      .stigi-note__body {
        margin: 0; font-size: var(--t-small);
        display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;
      }
      .stigi-note__reason {
        margin: var(--s-2) 0 0; padding: var(--s-1) var(--s-2); border: 1px solid var(--p-accent);
        border-radius: var(--r-sm); font-family: var(--font-mono); font-size: var(--t-label); line-height: 1.35;
      }
      .stigi-note__reason span { font-weight: 500; }

      .stigi-newzone {
        padding: var(--s-4); border: 2px dashed var(--p-muted); border-radius: var(--r-lg);
        transition: border-color var(--dur) var(--ease), background-color var(--dur) var(--ease);
      }
      .stigi-newzone[data-over="true"] { border-color: var(--p-accent); background: var(--p-surface); }
      .stigi-newzone__title { margin: 0 0 var(--s-1); font-weight: 500; }
      .stigi-newzone__hint { margin: 0; color: var(--p-muted); font-size: var(--t-small); }

      .stigi-empty { max-width: 560px; margin: 12vh auto 0; display: flex; flex-direction: column; align-items: flex-start; gap: var(--s-4); }
      .stigi-empty__title { font-size: var(--t-h3); }
      .stigi-empty__line { margin: 0; color: var(--p-muted); }

      .stigi-selection {
        position: sticky; bottom: 0; align-self: center; display: flex; align-items: center; gap: var(--s-3);
        padding: var(--s-2) var(--s-4); border-radius: 999px; background: var(--p-inv-bg); color: var(--p-inv-ink);
      }
      .stigi-selection .stigi-btn--secondary { background: var(--p-inv-surface); color: var(--p-inv-ink); border-color: var(--p-inv-ink); }

      .stigi-menu { position: relative; }
      .stigi-menu__toggle { width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; background: none; border: 0; border-radius: var(--r-sm); color: var(--p-ink); cursor: pointer; }
      .stigi-menu__toggle:hover { background: var(--p-bg); }
      .stigi-menu__panel {
        position: absolute; right: 0; top: 100%; z-index: 20; display: flex; flex-direction: column; min-width: 200px;
        padding: var(--s-1); background: var(--p-bg); border: 1px solid var(--p-ink); border-radius: var(--r-md);
      }
      .stigi-menu__item {
        padding: var(--s-2) var(--s-3); background: none; border: 0; border-radius: var(--r-sm);
        color: var(--p-ink); font: inherit; font-size: var(--t-small); text-align: left; cursor: pointer;
      }
      .stigi-menu__item:hover:not(:disabled) { background: var(--p-surface); }
      .stigi-menu__item:disabled { opacity: .45; cursor: not-allowed; }
      .stigi-rename { display: flex; gap: var(--s-2); flex: 1 1 auto; }
      .stigi-rename input {
        flex: 1 1 auto; min-width: 0; height: var(--btn-h-sm); padding: 0 var(--s-2);
        border: 1px solid var(--p-ink); border-radius: var(--r-sm); background: var(--p-bg); color: var(--p-ink); font: inherit;
      }

      .stigi-report {
        flex: 0 0 420px; width: 420px; display: flex; flex-direction: column; gap: var(--s-3);
        padding: var(--s-5); background: var(--p-bg); color: var(--p-ink); border-left: 1px solid var(--p-surface);
        font-family: var(--font-text);
      }
      .stigi-report__header { display: flex; align-items: center; justify-content: space-between; gap: var(--s-2); }
      .stigi-report__notice { margin: 0; padding: var(--s-2) var(--s-3); border-radius: var(--r-md); background: var(--p-surface); font-size: var(--t-small); }
      .stigi-report__editor {
        flex: 1 1 auto; min-height: 320px; resize: vertical; padding: var(--s-3);
        border: 1px solid var(--p-muted); border-radius: var(--r-md); background: var(--p-bg); color: var(--p-ink);
        font-family: var(--font-mono); font-size: var(--t-small); line-height: 1.5;
      }
      .stigi-report__actions { display: flex; flex-wrap: wrap; gap: var(--s-2); }

      .stigi-dialog-backdrop { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; background: rgba(56, 69, 15, .35); }
      .stigi-dialog {
        width: min(560px, calc(100vw - 32px)); display: flex; flex-direction: column; gap: var(--s-3); padding: var(--s-5);
        background: var(--p-bg); color: var(--p-ink); border-radius: var(--r-lg); font-family: var(--font-text);
      }
      .stigi-dialog textarea {
        min-height: 160px; padding: var(--s-3); border: 1px solid var(--p-muted); border-radius: var(--r-md);
        background: var(--p-bg); color: var(--p-ink); font-family: var(--font-mono); font-size: var(--t-small);
      }

      .stigi-sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

      @media (prefers-reduced-motion: reduce) {
        .stigi-route *, .stigi-route *::before, .stigi-route *::after { transition: none !important; animation: none !important; }
        .stigi-note:hover { transform: none; }
      }
      ```

- [ ] **Step 6: Run to confirm it passes (the gate)**
      Run: `pnpm vitest run app/styles/styles.test.ts`
      Expected: PASS — `Tests  3 passed (3)`

- [ ] **Step 7: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add UI dependencies, Stigi design tokens and the board stylesheet`

---

### Task 27: Pure board logic — auto-teach rule, agent-move diff, handoffs, drop targets

**Files:**
- Create: `app/lib/board/auto-teach.ts`
- Create: `app/lib/board/agent-moves.ts`
- Create: `app/lib/board/handoff.ts`
- Create: `app/lib/board/drop-target.ts`
- Test: `app/lib/board/board-logic.test.ts`

**Depends on:** Task 2
**Effort:** medium
**Provides:** `findAutoTeachCluster(board: BoardSnapshot, firedIds: ReadonlySet<string>): BoardCluster | null`, `diffAgentMoves(prev: BoardSnapshot | null, next: BoardSnapshot): string[]`, `allNotes(board: BoardSnapshot): BoardNote[]`, `buildTeachHandoff(cluster: Pick<BoardCluster, "id" | "notes">): Handoff`, `buildSortHandoff(): Handoff`, `buildReportHandoff(): Handoff`, `resolveDrop(noteId: string, currentClusterId: string | null, overId: string | null): DropAction`, `noteDragId(noteId: string): string`, `noteIdFromDragId(dragId: string): string`, `clusterDropId(clusterId: string): string`, `UNSORTED_DROP_ID = "drop:unsorted"`, `NEW_CLUSTER_DROP_ID = "drop:new-cluster"`
**Requires:** `type BoardNote`, `type BoardCluster`, `type BoardSnapshot`

- [ ] **Step 1: Write the failing test**
      Create `app/lib/board/board-logic.test.ts`:
      ```ts
      import { describe, expect, it } from "vitest";

      import type { BoardCluster, BoardNote, BoardSnapshot } from "@shared/board-types";

      import { allNotes, diffAgentMoves } from "./agent-moves";
      import { findAutoTeachCluster } from "./auto-teach";
      import {
        NEW_CLUSTER_DROP_ID, UNSORTED_DROP_ID, clusterDropId, noteDragId, noteIdFromDragId, resolveDrop,
      } from "./drop-target";
      import { buildReportHandoff, buildSortHandoff, buildTeachHandoff } from "./handoff";

      function note(id: string, clusterId: string | null, movedBy: BoardNote["movedBy"] = null, body = `note ${id}`): BoardNote {
        return { id, body, source: "sample", clusterId, reason: movedBy === "agent" ? "because" : null, movedBy, movedAt: null, position: 0 };
      }
      function cluster(id: string, name: string | null, createdBy: BoardCluster["createdBy"], notes: BoardNote[]): BoardCluster {
        return { id, name, createdBy, position: 0, notes };
      }
      function board(clusters: BoardCluster[], unsorted: BoardNote[] = []): BoardSnapshot {
        const total = unsorted.length + clusters.reduce((s, c) => s + c.notes.length, 0);
        return { clusters, unsorted, totalNotes: total, sampleNotes: total };
      }

      describe("findAutoTeachCluster", () => {
        it("fires once for a user-made untitled cluster with two or more notes", () => {
          const ready = cluster("c1", null, "user", [note("a", "c1"), note("b", "c1")]);
          const snapshot = board([cluster("c0", "Mobile app", "sample", [note("x", "c0")]), ready]);
          expect(findAutoTeachCluster(snapshot, new Set())?.id).toBe("c1");
          expect(findAutoTeachCluster(snapshot, new Set(["c1"]))).toBeNull();
        });

        it("ignores one-note, named, sample and agent clusters", () => {
          expect(findAutoTeachCluster(board([cluster("c1", null, "user", [note("a", "c1")])]), new Set())).toBeNull();
          expect(findAutoTeachCluster(board([cluster("c1", "Named", "user", [note("a", "c1"), note("b", "c1")])]), new Set())).toBeNull();
          expect(findAutoTeachCluster(board([cluster("c1", null, "agent", [note("a", "c1"), note("b", "c1")])]), new Set())).toBeNull();
          expect(findAutoTeachCluster(board([cluster("c1", null, "sample", [note("a", "c1"), note("b", "c1")])]), new Set())).toBeNull();
        });
      });

      describe("diffAgentMoves", () => {
        it("returns notes the agent moved between two snapshots", () => {
          const before = board([cluster("c1", "A", "sample", [note("a", "c1")]), cluster("c2", "B", "sample", [])], [note("u", null)]);
          const after = board([
            cluster("c1", "A", "sample", []),
            cluster("c2", "B", "sample", [note("a", "c2", "agent"), note("u", "c2", "user")]),
          ]);
          expect(diffAgentMoves(before, after)).toEqual(["a"]);
          expect(diffAgentMoves(null, after)).toEqual([]);
          expect(allNotes(after).map((n) => n.id)).toEqual(["a", "u"]);
        });
      });

      describe("handoffs", () => {
        it("carries the cluster id and up to five seeds in hidden context", () => {
          const seeds = Array.from({ length: 7 }, (_, i) => note(`n${i}`, "c9", null, `Seed  text ${i}`));
          const handoff = buildTeachHandoff({ id: "c9", notes: seeds });
          expect(handoff.message).toBe("Teach: name this new cluster and pull in every note that belongs with it.");
          expect(handoff.context).toContain("clusterId=c9");
          expect(handoff.context).toContain('[n0] "Seed text 0"');
          expect(handoff.context).toContain("[n4]");
          expect(handoff.context).not.toContain("[n5]");
          expect(handoff.context).toContain("teach-cluster skill");
        });

        it("asks for one sort batch of at most 25 and for the report", () => {
          expect(buildSortHandoff().message).toBe("Sort the next batch of unsorted notes (up to 25).");
          expect(buildSortHandoff().context).toContain("ONE batch of at most 25");
          expect(buildReportHandoff().context).toContain("write-report skill");
        });
      });

      describe("resolveDrop", () => {
        it("maps drop targets to actions", () => {
          expect(noteIdFromDragId(noteDragId("n1"))).toBe("n1");
          expect(resolveDrop("n1", "c1", NEW_CLUSTER_DROP_ID)).toEqual({ kind: "create-cluster", noteId: "n1" });
          expect(resolveDrop("n1", "c1", UNSORTED_DROP_ID)).toEqual({ kind: "move", noteId: "n1", clusterId: null });
          expect(resolveDrop("n1", null, UNSORTED_DROP_ID)).toEqual({ kind: "none" });
          expect(resolveDrop("n1", null, clusterDropId("c2"))).toEqual({ kind: "move", noteId: "n1", clusterId: "c2" });
          expect(resolveDrop("n1", "c2", clusterDropId("c2"))).toEqual({ kind: "none" });
          expect(resolveDrop("n1", "c2", null)).toEqual({ kind: "none" });
          expect(resolveDrop("n1", "c2", "something-else")).toEqual({ kind: "none" });
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run app/lib/board/board-logic.test.ts`
      Expected: FAIL — `Failed to resolve import "./agent-moves"`

- [ ] **Step 3: Implement the four modules**
      Create `app/lib/board/auto-teach.ts`:
      ```ts
      import type { BoardCluster, BoardSnapshot } from "@shared/board-types";

      export const AUTO_TEACH_MIN_SEEDS = 2;

      /** Spec D7: once per user-made, still-untitled cluster that has reached two seeds. */
      export function findAutoTeachCluster(board: BoardSnapshot, firedIds: ReadonlySet<string>): BoardCluster | null {
        for (const cluster of board.clusters) {
          if (cluster.createdBy !== "user") continue;
          if (cluster.name !== null) continue;
          if (cluster.notes.length < AUTO_TEACH_MIN_SEEDS) continue;
          if (firedIds.has(cluster.id)) continue;
          return cluster;
        }
        return null;
      }
      ```
      Create `app/lib/board/agent-moves.ts`:
      ```ts
      import type { BoardNote, BoardSnapshot } from "@shared/board-types";

      export function allNotes(board: BoardSnapshot): BoardNote[] {
        return [...board.unsorted, ...board.clusters.flatMap((c) => c.notes)];
      }

      /** Ids whose cluster changed between two snapshots and whose latest move was the agent's (highlight ring). */
      export function diffAgentMoves(prev: BoardSnapshot | null, next: BoardSnapshot): string[] {
        if (!prev) return [];
        const before = new Map<string, string | null>();
        for (const n of allNotes(prev)) before.set(n.id, n.clusterId);
        const moved: string[] = [];
        for (const n of allNotes(next)) {
          if (!before.has(n.id)) continue;
          if (before.get(n.id) !== n.clusterId && n.movedBy === "agent") moved.push(n.id);
        }
        return moved;
      }
      ```
      Create `app/lib/board/handoff.ts`:
      ```ts
      import type { BoardCluster } from "@shared/board-types";

      export interface Handoff {
        message: string;
        context: string;
      }

      export const MAX_TEACH_SEEDS = 5;
      export const SORT_BATCH_SIZE = 25;

      function flatten(text: string, maxChars: number): string {
        const flat = text.replace(/\s+/g, " ").trim();
        return flat.length > maxChars ? `${flat.slice(0, maxChars - 1)}…` : flat;
      }

      export function buildTeachHandoff(cluster: Pick<BoardCluster, "id" | "notes">): Handoff {
        const seeds = cluster.notes
          .slice(0, MAX_TEACH_SEEDS)
          .map((n) => `[${n.id}] "${flatten(n.body, 200)}"`)
          .join("; ");
        return {
          message: "Teach: name this new cluster and pull in every note that belongs with it.",
          context: `Stigi teach request. clusterId=${cluster.id}. Seed notes: ${seeds}. Follow the teach-cluster skill.`,
        };
      }

      export function buildSortHandoff(): Handoff {
        return {
          message: `Sort the next batch of unsorted notes (up to ${SORT_BATCH_SIZE}).`,
          context: `Stigi sort request. Follow the sort-feedback skill. Process ONE batch of at most ${SORT_BATCH_SIZE} unsorted notes, then stop.`,
        };
      }

      export function buildReportHandoff(): Handoff {
        return {
          message: "Write the insight report from the current board.",
          context: "Stigi report request. Follow the write-report skill.",
        };
      }
      ```
      Create `app/lib/board/drop-target.ts`:
      ```ts
      export const UNSORTED_DROP_ID = "drop:unsorted";
      export const NEW_CLUSTER_DROP_ID = "drop:new-cluster";
      const CLUSTER_DROP_PREFIX = "drop:cluster:";
      const NOTE_DRAG_PREFIX = "note:";

      export type DropAction =
        | { kind: "create-cluster"; noteId: string }
        | { kind: "move"; noteId: string; clusterId: string | null }
        | { kind: "none" };

      export function clusterDropId(clusterId: string): string {
        return `${CLUSTER_DROP_PREFIX}${clusterId}`;
      }

      export function noteDragId(noteId: string): string {
        return `${NOTE_DRAG_PREFIX}${noteId}`;
      }

      export function noteIdFromDragId(dragId: string): string {
        return dragId.startsWith(NOTE_DRAG_PREFIX) ? dragId.slice(NOTE_DRAG_PREFIX.length) : dragId;
      }

      export function resolveDrop(noteId: string, currentClusterId: string | null, overId: string | null): DropAction {
        if (overId === null) return { kind: "none" };
        if (overId === NEW_CLUSTER_DROP_ID) return { kind: "create-cluster", noteId };
        if (overId === UNSORTED_DROP_ID) {
          return currentClusterId === null ? { kind: "none" } : { kind: "move", noteId, clusterId: null };
        }
        if (overId.startsWith(CLUSTER_DROP_PREFIX)) {
          const clusterId = overId.slice(CLUSTER_DROP_PREFIX.length);
          return clusterId === currentClusterId ? { kind: "none" } : { kind: "move", noteId, clusterId };
        }
        return { kind: "none" };
      }
      ```

- [ ] **Step 4: Run to confirm it passes (the gate)**
      Run: `pnpm vitest run app/lib/board/board-logic.test.ts`
      Expected: PASS — `Tests  6 passed (6)`

- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add pure board logic (auto-teach rule, agent-move diff, handoffs, drop targets)`

---

### Task 28: `NoteCard` component

**Files:**
- Create: `app/components/board/NoteCard.tsx`
- Test: `app/components/board/NoteCard.test.tsx`

**Depends on:** Task 2, Task 26, Task 27
**Effort:** medium
**Provides:** `<NoteCard note selected highlighted onToggleSelect />`
**Requires:** `type BoardNote`, `noteDragId(noteId: string): string`, `deps: @dnd-kit/core 6.3.1, motion 14.10.1, @testing-library/react 16.3.3, @testing-library/dom 10.4.2`, `app/styles/board.css`

UI task: applies `docs/design/frontend.md` (the one card style from `board.css`: `.stigi-note`, 2 px hover lift, accent ring for selection/highlight; reason chip in the mono face). The outer `motion.div` carries the layout animation (`layoutId`), the inner `article` carries dnd-kit's listeners, so their props never collide.

- [ ] **Step 1: Write the failing test**
      Create `app/components/board/NoteCard.test.tsx`:
      ```tsx
      // @vitest-environment happy-dom
      import { DndContext } from "@dnd-kit/core";
      import { cleanup, fireEvent, render, screen } from "@testing-library/react";
      import { afterEach, describe, expect, it, vi } from "vitest";

      import type { BoardNote } from "@shared/board-types";

      import { NoteCard } from "./NoteCard";

      afterEach(() => cleanup());

      const base: BoardNote = {
        id: "n1", body: "which plan am I even on?", source: "sample", clusterId: "c1",
        reason: null, movedBy: null, movedAt: null, position: 0,
      };

      function renderCard(note: BoardNote, onToggleSelect = vi.fn()) {
        render(
          <DndContext>
            <NoteCard note={note} selected={false} highlighted={false} onToggleSelect={onToggleSelect} />
          </DndContext>,
        );
        return onToggleSelect;
      }

      describe("NoteCard", () => {
        it("renders the body with test hooks and no reason chip for an untouched sample note", () => {
          renderCard(base);
          const card = screen.getByText("which plan am I even on?").closest("[data-note-id]");
          expect(card?.getAttribute("data-note-id")).toBe("n1");
          expect(card?.getAttribute("data-cluster-id")).toBe("c1");
          expect(card?.getAttribute("data-moved-by")).toBe("none");
          expect(screen.queryByText(/Agent:/)).toBeNull();
          expect(screen.getByText("Sample note")).toBeTruthy();
        });

        it("shows the agent's one-line reason", () => {
          renderCard({ ...base, clusterId: null, movedBy: "agent", reason: "Unsure which plan they're on" });
          expect(screen.getByText("Agent:")).toBeTruthy();
          expect(screen.getByText(/Unsure which plan they're on/)).toBeTruthy();
          const card = screen.getByText("which plan am I even on?").closest("[data-note-id]");
          expect(card?.getAttribute("data-cluster-id")).toBe("unsorted");
          expect(card?.getAttribute("data-moved-by")).toBe("agent");
        });

        it("toggles selection on click", () => {
          const onToggle = renderCard(base);
          fireEvent.click(screen.getByText("which plan am I even on?"));
          expect(onToggle).toHaveBeenCalledWith("n1");
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run app/components/board/NoteCard.test.tsx`
      Expected: FAIL — `Failed to resolve import "./NoteCard"`

- [ ] **Step 3: Implement the component**
      Create `app/components/board/NoteCard.tsx`:
      ```tsx
      import { useDraggable } from "@dnd-kit/core";
      import { motion } from "motion/react";

      import type { BoardNote } from "@shared/board-types";

      import { noteDragId } from "@/lib/board/drop-target";

      export interface NoteCardProps {
        note: BoardNote;
        selected: boolean;
        highlighted: boolean;
        onToggleSelect: (noteId: string) => void;
      }

      export function NoteCard({ note, selected, highlighted, onToggleSelect }: NoteCardProps) {
        const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: noteDragId(note.id) });
        return (
          <motion.div layout="position" layoutId={note.id} transition={{ type: "spring", stiffness: 380, damping: 34 }}>
            <article
              ref={setNodeRef}
              className="stigi-note"
              data-note-id={note.id}
              data-cluster-id={note.clusterId ?? "unsorted"}
              data-moved-by={note.movedBy ?? "none"}
              data-selected={selected ? "true" : "false"}
              data-highlighted={highlighted ? "true" : "false"}
              data-dragging={isDragging ? "true" : "false"}
              onClick={() => onToggleSelect(note.id)}
              {...attributes}
              {...listeners}
            >
              <p className="stigi-note__body">{note.body}</p>
              {note.movedBy === "agent" && note.reason ? (
                <p className="stigi-note__reason" title={note.reason}>
                  <span>Agent:</span> {note.reason}
                </p>
              ) : null}
              {note.source === "sample" ? <span className="stigi-sr-only">Sample note</span> : null}
            </article>
          </motion.div>
        );
      }
      ```

- [ ] **Step 4: Run to confirm it passes (the gate)**
      Run: `pnpm vitest run app/components/board/NoteCard.test.tsx`
      Expected: PASS — `Tests  3 passed (3)`

- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add the draggable, animated NoteCard`

---

### Task 29: `ClusterColumn`, `NewClusterZone` and `ClusterMenu`

**Files:**
- Create: `app/components/board/ClusterColumn.tsx`
- Create: `app/components/board/NewClusterZone.tsx`
- Create: `app/components/board/ClusterMenu.tsx`
- Test: `app/components/board/ClusterColumn.test.tsx`

**Depends on:** Task 2, Task 27, Task 28
**Effort:** medium
**Provides:** `<ClusterColumn dropId clusterId title untitled notes selectedIds highlightedIds onToggleSelect actions />`, `<NewClusterZone />`, `<ClusterMenu clusterName agentDisabled onMoreLikeThese onRename mergeTargets onMerge onDelete />`
**Requires:** `<NoteCard note selected highlighted onToggleSelect />`, `NEW_CLUSTER_DROP_ID = "drop:new-cluster"`, `type BoardNote`

UI task: applies `docs/design/frontend.md` (one card surface per column on `--p-surface`, `--r-lg` radius, accent border while a note hovers, mono count, the one menu style; no browser dialogs — rename is inline, delete is a two-click confirm). `ClusterMenu` already renders Merge/Delete when handlers are given; the board passes `null` until Task 38 wires them.

- [ ] **Step 1: Write the failing test**
      Create `app/components/board/ClusterColumn.test.tsx`:
      ```tsx
      // @vitest-environment happy-dom
      import { DndContext } from "@dnd-kit/core";
      import { cleanup, fireEvent, render, screen } from "@testing-library/react";
      import { afterEach, describe, expect, it, vi } from "vitest";

      import type { BoardNote } from "@shared/board-types";

      import { ClusterColumn } from "./ClusterColumn";
      import { ClusterMenu } from "./ClusterMenu";
      import { NewClusterZone } from "./NewClusterZone";

      afterEach(() => cleanup());

      function note(id: string): BoardNote {
        return { id, body: `body ${id}`, source: "sample", clusterId: "c1", reason: null, movedBy: null, movedAt: null, position: 0 };
      }

      function column(untitled: boolean, notes: BoardNote[]) {
        render(
          <DndContext>
            <ClusterColumn
              dropId="drop:cluster:c1" clusterId="c1" title={untitled ? "Untitled" : "Mobile app"} untitled={untitled}
              notes={notes} selectedIds={new Set()} highlightedIds={new Set()} onToggleSelect={vi.fn()} actions={null}
            />
            <NewClusterZone />
          </DndContext>,
        );
      }

      describe("ClusterColumn", () => {
        it("renders a named column with its count, notes and test hooks", () => {
          column(false, [note("a"), note("b")]);
          expect(screen.getByRole("heading", { name: "Mobile app" })).toBeTruthy();
          expect(screen.getByText("2")).toBeTruthy();
          const section = screen.getByRole("region", { name: "Mobile app" });
          expect(section.getAttribute("data-cluster-name")).toBe("Mobile app");
          expect(section.querySelectorAll("[data-note-id]")).toHaveLength(2);
          expect(screen.getByTestId("new-cluster-zone")).toBeTruthy();
          expect(screen.getByText(/the agent names it and pulls in matches/)).toBeTruthy();
        });

        it("explains the untitled states", () => {
          column(true, [note("a")]);
          expect(screen.getByText("Untitled — drop one more note to teach the agent")).toBeTruthy();
          cleanup();
          column(true, [note("a"), note("b")]);
          expect(screen.getByText("Untitled — the agent is naming this…")).toBeTruthy();
        });
      });

      describe("ClusterMenu", () => {
        it("offers more-like-these and inline rename; hides merge and delete without handlers", () => {
          const onMore = vi.fn();
          const onRename = vi.fn();
          render(<ClusterMenu clusterName="Mobile app" agentDisabled={false} onMoreLikeThese={onMore} onRename={onRename} mergeTargets={[]} onMerge={null} onDelete={null} />);
          fireEvent.click(screen.getByRole("button", { name: "Cluster actions for Mobile app" }));
          expect(screen.queryByRole("button", { name: "Merge into…" })).toBeNull();
          expect(screen.queryByRole("button", { name: "Delete cluster" })).toBeNull();
          fireEvent.click(screen.getByRole("button", { name: "More like these" }));
          expect(onMore).toHaveBeenCalledTimes(1);
          fireEvent.click(screen.getByRole("button", { name: "Cluster actions for Mobile app" }));
          fireEvent.click(screen.getByRole("button", { name: "Rename" }));
          fireEvent.change(screen.getByLabelText("Cluster name"), { target: { value: "  Mobile crashes  " } });
          fireEvent.click(screen.getByRole("button", { name: "Save name" }));
          expect(onRename).toHaveBeenCalledWith("Mobile crashes");
        });

        it("merges into a chosen target and deletes only on the second click", () => {
          const onMerge = vi.fn();
          const onDelete = vi.fn();
          render(<ClusterMenu clusterName="A" agentDisabled={true} onMoreLikeThese={vi.fn()} onRename={vi.fn()} mergeTargets={[{ id: "c2", name: "B" }]} onMerge={onMerge} onDelete={onDelete} />);
          fireEvent.click(screen.getByRole("button", { name: "Cluster actions for A" }));
          expect((screen.getByRole("button", { name: "More like these" }) as HTMLButtonElement).disabled).toBe(true);
          fireEvent.click(screen.getByRole("button", { name: "Merge into…" }));
          fireEvent.click(screen.getByRole("button", { name: "Merge into B" }));
          expect(onMerge).toHaveBeenCalledWith("c2");
          fireEvent.click(screen.getByRole("button", { name: "Cluster actions for A" }));
          fireEvent.click(screen.getByRole("button", { name: "Delete cluster" }));
          expect(onDelete).not.toHaveBeenCalled();
          fireEvent.click(screen.getByRole("button", { name: "Click again to delete" }));
          expect(onDelete).toHaveBeenCalledTimes(1);
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run app/components/board/ClusterColumn.test.tsx`
      Expected: FAIL — `Failed to resolve import "./ClusterColumn"`

- [ ] **Step 3: Implement the three components**
      Create `app/components/board/ClusterColumn.tsx`:
      ```tsx
      import { useDroppable } from "@dnd-kit/core";
      import { motion } from "motion/react";
      import type { ReactNode } from "react";

      import type { BoardNote } from "@shared/board-types";

      import { NoteCard } from "./NoteCard";

      export interface ClusterColumnProps {
        dropId: string;
        clusterId: string | null;
        title: string;
        untitled: boolean;
        notes: BoardNote[];
        selectedIds: ReadonlySet<string>;
        highlightedIds: ReadonlySet<string>;
        onToggleSelect: (noteId: string) => void;
        actions: ReactNode;
      }

      function untitledCopy(count: number): string {
        return count < 2 ? "Untitled — drop one more note to teach the agent" : "Untitled — the agent is naming this…";
      }

      export function ClusterColumn(props: ClusterColumnProps) {
        const { setNodeRef, isOver } = useDroppable({ id: props.dropId });
        return (
          <section
            ref={setNodeRef}
            className="stigi-column"
            aria-label={props.title}
            data-cluster-id={props.clusterId ?? "unsorted"}
            data-cluster-name={props.title}
            data-over={isOver ? "true" : "false"}
          >
            <header className="stigi-column__header">
              <h2 className={props.untitled ? "stigi-column__title stigi-column__title--untitled" : "stigi-column__title"}>
                {props.untitled ? untitledCopy(props.notes.length) : props.title}
              </h2>
              <span className="stigi-column__count">{props.notes.length}</span>
              {props.actions}
            </header>
            <motion.div layoutScroll className="stigi-column__notes">
              {props.notes.map((n) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  selected={props.selectedIds.has(n.id)}
                  highlighted={props.highlightedIds.has(n.id)}
                  onToggleSelect={props.onToggleSelect}
                />
              ))}
            </motion.div>
          </section>
        );
      }
      ```
      Create `app/components/board/NewClusterZone.tsx`:
      ```tsx
      import { useDroppable } from "@dnd-kit/core";

      import { NEW_CLUSTER_DROP_ID } from "@/lib/board/drop-target";

      export function NewClusterZone() {
        const { setNodeRef, isOver } = useDroppable({ id: NEW_CLUSTER_DROP_ID });
        return (
          <section ref={setNodeRef} className="stigi-newzone" data-testid="new-cluster-zone" data-over={isOver ? "true" : "false"} aria-label="New cluster">
            <p className="stigi-newzone__title">New cluster</p>
            <p className="stigi-newzone__hint">
              Drop a note here to start a cluster. Add a second note and the agent names it and pulls in matches.
            </p>
          </section>
        );
      }
      ```
      Create `app/components/board/ClusterMenu.tsx`:
      ```tsx
      import { IconDots } from "@tabler/icons-react";
      import { useState, type FormEvent } from "react";

      export interface ClusterMenuProps {
        clusterName: string | null;
        agentDisabled: boolean;
        onMoreLikeThese: () => void;
        onRename: (name: string) => void;
        mergeTargets: { id: string; name: string }[];
        onMerge: ((targetClusterId: string) => void) | null;
        onDelete: (() => void) | null;
      }

      type Mode = "closed" | "open" | "rename" | "merge";

      export function ClusterMenu(props: ClusterMenuProps) {
        const label = props.clusterName ?? "Untitled";
        const [mode, setMode] = useState<Mode>("closed");
        const [draft, setDraft] = useState(props.clusterName ?? "");
        const [confirmDelete, setConfirmDelete] = useState(false);

        function close() {
          setMode("closed");
          setConfirmDelete(false);
        }

        function submitRename(event: FormEvent) {
          event.preventDefault();
          const name = draft.trim().slice(0, 60);
          if (name.length > 0) props.onRename(name);
          close();
        }

        if (mode === "rename") {
          return (
            <form className="stigi-rename" onSubmit={submitRename}>
              <input
                aria-label="Cluster name"
                value={draft}
                maxLength={60}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") close();
                }}
              />
              <button type="submit" className="stigi-btn stigi-btn--primary">Save name</button>
            </form>
          );
        }

        return (
          <div className="stigi-menu">
            <button
              type="button"
              className="stigi-menu__toggle"
              aria-label={`Cluster actions for ${label}`}
              aria-expanded={mode !== "closed"}
              onClick={() => (mode === "closed" ? setMode("open") : close())}
            >
              <IconDots size={16} stroke={1.8} />
            </button>
            {mode === "open" ? (
              <div className="stigi-menu__panel">
                <button type="button" className="stigi-menu__item" disabled={props.agentDisabled}
                  onClick={() => { close(); props.onMoreLikeThese(); }}>
                  More like these
                </button>
                <button type="button" className="stigi-menu__item"
                  onClick={() => { setDraft(props.clusterName ?? ""); setMode("rename"); }}>
                  Rename
                </button>
                {props.onMerge && props.mergeTargets.length > 0 ? (
                  <button type="button" className="stigi-menu__item" onClick={() => setMode("merge")}>
                    Merge into…
                  </button>
                ) : null}
                {props.onDelete ? (
                  <button type="button" className="stigi-menu__item"
                    onClick={() => {
                      if (!confirmDelete) { setConfirmDelete(true); return; }
                      close();
                      props.onDelete?.();
                    }}>
                    {confirmDelete ? "Click again to delete" : "Delete cluster"}
                  </button>
                ) : null}
              </div>
            ) : null}
            {mode === "merge" && props.onMerge ? (
              <div className="stigi-menu__panel">
                {props.mergeTargets.map((target) => (
                  <button key={target.id} type="button" className="stigi-menu__item"
                    aria-label={`Merge into ${target.name}`}
                    onClick={() => { close(); props.onMerge?.(target.id); }}>
                    {target.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        );
      }
      ```

- [ ] **Step 4: Run to confirm it passes (the gate)**
      Run: `pnpm vitest run app/components/board/ClusterColumn.test.tsx`
      Expected: PASS — `Tests  4 passed (4)`

- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add ClusterColumn, NewClusterZone and ClusterMenu`

---

### Task 30: `EmptyBoard`, `BoardTopBar` and `SelectionBar`

**Files:**
- Create: `app/components/board/EmptyBoard.tsx`
- Create: `app/components/board/BoardTopBar.tsx`
- Create: `app/components/board/SelectionBar.tsx`
- Test: `app/components/board/BoardChrome.test.tsx`

**Depends on:** Task 2, Task 14, Task 23, Task 26
**Effort:** medium
**Provides:** `<EmptyBoard loading onLoadSample onImportCsv />`, `<BoardTopBar totalNotes themeCount unsortedCount sampleNotes usage agentRunning autoTeach onAutoTeachChange sorting onSortToggle onImportCsv onOpenReport onResetBoard />`, `<SelectionBar count canTeach onMoreLikeThese onClear />`
**Requires:** `SAMPLE_LABEL = "Sample data · pre-sorted starting layout"`, `dailyLimitMessage(limit: number): string`, `type AgentUsage`, `app/styles/board.css`

UI task: applies `docs/design/frontend.md` (copy rules from `references/copy.md`: a noun in every heading, buttons as verb + object; the one primary/secondary button pair; one main action on the empty screen). Spec D10/D15 first-run copy is verbatim below. Handlers that later tasks provide are typed `(() => void) | null`; `null` hides that control, so no dead buttons ship.

- [ ] **Step 1: Write the failing test**
      Create `app/components/board/BoardChrome.test.tsx`:
      ```tsx
      // @vitest-environment happy-dom
      import { cleanup, fireEvent, render, screen } from "@testing-library/react";
      import { afterEach, describe, expect, it, vi } from "vitest";

      import { BoardTopBar, type BoardTopBarProps } from "./BoardTopBar";
      import { EmptyBoard } from "./EmptyBoard";
      import { SelectionBar } from "./SelectionBar";

      afterEach(() => cleanup());

      function topBar(overrides: Partial<BoardTopBarProps> = {}) {
        const props: BoardTopBarProps = {
          totalNotes: 200, themeCount: 6, unsortedCount: 50, sampleNotes: 200,
          usage: { used: 28, limit: 40, remaining: 12, resetsAt: "2026-11-10T00:00:00.000Z" },
          agentRunning: false, autoTeach: true, onAutoTeachChange: vi.fn(),
          sorting: false, onSortToggle: vi.fn(), onImportCsv: vi.fn(), onOpenReport: vi.fn(), onResetBoard: vi.fn(),
          ...overrides,
        };
        render(<BoardTopBar {...props} />);
        return props;
      }

      describe("EmptyBoard", () => {
        it("offers exactly one obvious action plus a quiet CSV link", () => {
          const onLoad = vi.fn();
          const onImport = vi.fn();
          render(<EmptyBoard loading={false} onLoadSample={onLoad} onImportCsv={onImport} />);
          expect(screen.getByRole("heading", { name: "Sort customer feedback with an agent" })).toBeTruthy();
          expect(screen.getByText(/200 synthetic sample comments for a fictional expenses app, already roughly sorted/)).toBeTruthy();
          fireEvent.click(screen.getByRole("button", { name: "Load sample data (200 notes)" }));
          expect(onLoad).toHaveBeenCalledTimes(1);
          fireEvent.click(screen.getByRole("button", { name: "or import your own CSV" }));
          expect(onImport).toHaveBeenCalledTimes(1);
        });

        it("hides the CSV link until import is wired", () => {
          render(<EmptyBoard loading={true} onLoadSample={vi.fn()} onImportCsv={null} />);
          expect(screen.queryByRole("button", { name: "or import your own CSV" })).toBeNull();
          expect((screen.getByRole("button", { name: "Loading sample…" }) as HTMLButtonElement).disabled).toBe(true);
        });
      });

      describe("BoardTopBar", () => {
        it("labels sample data and shows counts and remaining agent turns", () => {
          topBar();
          expect(screen.getByRole("heading", { name: "Feedback board" })).toBeTruthy();
          expect(screen.getByText("Sample data · pre-sorted starting layout")).toBeTruthy();
          expect(screen.getByText("200 notes · 6 themes · 50 unsorted")).toBeTruthy();
          expect(screen.getByText("12 of 40 agent turns left today")).toBeTruthy();
        });

        it("hides the sample chip for non-sample boards and controls whose handler is null", () => {
          topBar({ sampleNotes: 0, onSortToggle: null, onImportCsv: null, onOpenReport: null, onResetBoard: null });
          expect(screen.queryByText("Sample data · pre-sorted starting layout")).toBeNull();
          expect(screen.queryByRole("button", { name: "Sort with agent" })).toBeNull();
          expect(screen.queryByRole("button", { name: "Import CSV" })).toBeNull();
          expect(screen.queryByRole("button", { name: "Report" })).toBeNull();
          expect(screen.queryByRole("button", { name: "Reset board" })).toBeNull();
        });

        it("explains spent demo credits and disables sorting", () => {
          topBar({ usage: { used: 40, limit: 40, remaining: 0, resetsAt: "2026-11-10T00:00:00.000Z" } });
          expect(screen.getByRole("status").textContent).toContain("Demo credits for today are used");
          expect((screen.getByRole("button", { name: "Sort with agent" }) as HTMLButtonElement).disabled).toBe(true);
        });

        it("toggles sorting, auto-teach and confirms a reset on the second click", () => {
          const props = topBar({ sorting: true });
          fireEvent.click(screen.getByRole("button", { name: "Stop sorting" }));
          expect(props.onSortToggle).toHaveBeenCalledTimes(1);
          fireEvent.click(screen.getByRole("switch", { name: "Auto-teach" }));
          expect(props.onAutoTeachChange).toHaveBeenCalledWith(false);
          fireEvent.click(screen.getByRole("button", { name: "Reset board" }));
          expect(props.onResetBoard).not.toHaveBeenCalled();
          fireEvent.click(screen.getByRole("button", { name: "Click again to reset" }));
          expect(props.onResetBoard).toHaveBeenCalledTimes(1);
        });
      });

      describe("SelectionBar", () => {
        it("appears with a selection and teaches only with two or more notes", () => {
          const onMore = vi.fn();
          const { rerender } = render(<SelectionBar count={0} canTeach={true} onMoreLikeThese={onMore} onClear={vi.fn()} />);
          expect(screen.queryByText(/selected/)).toBeNull();
          rerender(<SelectionBar count={1} canTeach={true} onMoreLikeThese={onMore} onClear={vi.fn()} />);
          expect((screen.getByRole("button", { name: "More like these" }) as HTMLButtonElement).disabled).toBe(true);
          rerender(<SelectionBar count={2} canTeach={true} onMoreLikeThese={onMore} onClear={vi.fn()} />);
          expect(screen.getByText("2 selected")).toBeTruthy();
          fireEvent.click(screen.getByRole("button", { name: "More like these" }));
          expect(onMore).toHaveBeenCalledTimes(1);
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm vitest run app/components/board/BoardChrome.test.tsx`
      Expected: FAIL — `Failed to resolve import "./BoardTopBar"`

- [ ] **Step 3: Implement the three components**
      Create `app/components/board/EmptyBoard.tsx`:
      ```tsx
      export interface EmptyBoardProps {
        loading: boolean;
        onLoadSample: () => void;
        onImportCsv: (() => void) | null;
      }

      export function EmptyBoard({ loading, onLoadSample, onImportCsv }: EmptyBoardProps) {
        return (
          <section className="stigi-empty" aria-labelledby="stigi-empty-title">
            <h2 id="stigi-empty-title" className="stigi-empty__title">Sort customer feedback with an agent</h2>
            <p className="stigi-empty__line">
              Load 200 synthetic sample comments for a fictional expenses app, already roughly sorted. Drag two notes into a
              new cluster to teach the agent a theme.
            </p>
            <button type="button" className="stigi-btn stigi-btn--primary" onClick={onLoadSample} disabled={loading}>
              {loading ? "Loading sample…" : "Load sample data (200 notes)"}
            </button>
            {onImportCsv ? (
              <button type="button" className="stigi-link" onClick={onImportCsv}>or import your own CSV</button>
            ) : null}
          </section>
        );
      }
      ```
      Create `app/components/board/BoardTopBar.tsx`:
      ```tsx
      import { useState } from "react";

      import { dailyLimitMessage } from "@shared/agent-limits";
      import type { AgentUsage } from "@shared/board-types";
      import { SAMPLE_LABEL } from "@shared/sample-feedback";

      export interface BoardTopBarProps {
        totalNotes: number;
        themeCount: number;
        unsortedCount: number;
        sampleNotes: number;
        usage: AgentUsage | null;
        agentRunning: boolean;
        autoTeach: boolean;
        onAutoTeachChange: (value: boolean) => void;
        sorting: boolean;
        onSortToggle: (() => void) | null;
        onImportCsv: (() => void) | null;
        onOpenReport: (() => void) | null;
        onResetBoard: (() => void) | null;
      }

      export function BoardTopBar(props: BoardTopBarProps) {
        const [confirmReset, setConfirmReset] = useState(false);
        const outOfCredits = props.usage !== null && props.usage.remaining <= 0;
        const sortDisabled = !props.sorting && (outOfCredits || props.unsortedCount === 0 || props.agentRunning);
        return (
          <div className="stigi-topbar-wrap">
            <div className="stigi-topbar">
              <h1 className="stigi-topbar__title">Feedback board</h1>
              {props.sampleNotes > 0 ? <span className="stigi-chip">{SAMPLE_LABEL}</span> : null}
              <span className="stigi-meta">
                {`${props.totalNotes} notes · ${props.themeCount} themes · ${props.unsortedCount} unsorted`}
              </span>
              {props.usage ? (
                <span className="stigi-meta">{`${props.usage.remaining} of ${props.usage.limit} agent turns left today`}</span>
              ) : null}
              {props.agentRunning ? <span className="stigi-pill">Agent working…</span> : null}
              <div className="stigi-topbar__actions">
                <label className="stigi-switch">
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label="Auto-teach"
                    checked={props.autoTeach}
                    onChange={(e) => props.onAutoTeachChange(e.target.checked)}
                  />
                  Auto-teach
                </label>
                {props.onImportCsv ? (
                  <button type="button" className="stigi-btn stigi-btn--secondary" onClick={props.onImportCsv}>Import CSV</button>
                ) : null}
                {props.onSortToggle ? (
                  <button type="button" className="stigi-btn stigi-btn--primary" disabled={sortDisabled} onClick={props.onSortToggle}>
                    {props.sorting ? "Stop sorting" : "Sort with agent"}
                  </button>
                ) : null}
                {props.onOpenReport ? (
                  <button type="button" className="stigi-btn stigi-btn--secondary" onClick={props.onOpenReport}>Report</button>
                ) : null}
                {props.onResetBoard ? (
                  <button
                    type="button"
                    className="stigi-btn stigi-btn--secondary"
                    onClick={() => {
                      if (!confirmReset) { setConfirmReset(true); return; }
                      setConfirmReset(false);
                      props.onResetBoard?.();
                    }}
                    onBlur={() => setConfirmReset(false)}
                  >
                    {confirmReset ? "Click again to reset" : "Reset board"}
                  </button>
                ) : null}
              </div>
            </div>
            {outOfCredits && props.usage ? (
              <p role="status" className="stigi-banner">{dailyLimitMessage(props.usage.limit)}</p>
            ) : null}
          </div>
        );
      }
      ```
      Create `app/components/board/SelectionBar.tsx`:
      ```tsx
      export interface SelectionBarProps {
        count: number;
        canTeach: boolean;
        onMoreLikeThese: () => void;
        onClear: () => void;
      }

      export function SelectionBar({ count, canTeach, onMoreLikeThese, onClear }: SelectionBarProps) {
        if (count === 0) return null;
        return (
          <div className="stigi-selection" role="toolbar" aria-label="Selection">
            <span>{`${count} selected`}</span>
            <button type="button" className="stigi-btn stigi-btn--secondary" disabled={count < 2 || !canTeach} onClick={onMoreLikeThese}>
              More like these
            </button>
            <button type="button" className="stigi-link" onClick={onClear}>Clear</button>
          </div>
        );
      }
      ```

- [ ] **Step 4: Run to confirm it passes (the gate)**
      Run: `pnpm vitest run app/components/board/BoardChrome.test.tsx`
      Expected: PASS — `Tests  7 passed (7)`

- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add the first-run EmptyBoard, the board top bar and the selection bar`

---

### Task 31: `BoardPage` — live board, drag-and-drop, glide-in, selection app-state, auto-teach

**Files:**
- Create: `app/components/board/BoardPage.tsx`
- Modify: `app/routes/board.tsx`

**Depends on:** Task 3, Task 17, Task 18, Task 19, Task 20, Task 23, Task 27, Task 29, Task 30
**Effort:** high
**Provides:** `<BoardPage /> (data-agent-state, 2 s polling while the agent runs, DnD, glide-in, selection app-state, auto-teach)`, `app/routes/board.tsx renders BoardPage + Outlet with fonts and styles`
**Requires:** `action import-notes { csv?: string; sample?: boolean }`, `action get-board {} -> BoardSnapshot`, `action create-cluster { name?: string; noteIds?: string[] } -> { id, name, message }`, `action rename-cluster { clusterId: string; name: string }`, `action move-notes { moves: { noteId: string; clusterId: string | null; reason?: string }[] }`, `action get-agent-usage {} -> AgentUsage & { id, message }`, `dailyLimitMessage(limit: number): string`, `findAutoTeachCluster(board: BoardSnapshot, firedIds: ReadonlySet<string>): BoardCluster | null`, `diffAgentMoves(prev: BoardSnapshot | null, next: BoardSnapshot): string[]`, `allNotes(board: BoardSnapshot): BoardNote[]`, `buildTeachHandoff(cluster: Pick<BoardCluster, "id" | "notes">): Handoff`, `resolveDrop(noteId: string, currentClusterId: string | null, overId: string | null): DropAction`, `noteIdFromDragId(dragId: string): string`, `clusterDropId(clusterId: string): string`, `<ClusterColumn dropId clusterId title untitled notes selectedIds highlightedIds onToggleSelect actions />`, `<NewClusterZone />`, `<ClusterMenu clusterName agentDisabled onMoreLikeThese onRename mergeTargets onMerge onDelete />`, `<EmptyBoard loading onLoadSample onImportCsv />`, `<BoardTopBar totalNotes themeCount unsortedCount sampleNotes usage agentRunning autoTeach onAutoTeachChange sorting onSortToggle onImportCsv onOpenReport onResetBoard />`, `<SelectionBar count canTeach onMoreLikeThese onClear />`, `/board route shell with h1 "Feedback board"`

UI task: applies `docs/design/frontend.md` (layout: left rail = New-cluster zone + Unsorted, right = cluster grid; `MotionConfig reducedMotion="user"`; fonts and token/board stylesheets loaded by the route's `links()`). Framework signatures used (core 0.226.0):
- `useActionQuery(actionName, params?, options?)` and `useActionMutation(actionName, options?)` from `@agent-native/core/client/hooks` (types inferred from `.generated/action-types.d.ts`); `setClientAppState<T>(key: string, value: T | null | undefined, options?: { keepalive?: boolean }): Promise<T | null>`; `actionErrorMessage(error: unknown): string`.
- `useAgentChatGenerating(): [isGenerating: boolean, send: (opts: { message: string; context?: string; submit?: boolean; openSidebar?: boolean }) => string, …]` from `@agent-native/core/client/agent-chat`.
- Agent tool completions already invalidate this tab's action queries; the 2 s `refetchInterval` while `isGenerating` is the belt-and-braces poll for serverless (spec §9).

- [ ] **Step 1: Write the board page**
      Create `app/components/board/BoardPage.tsx`:
      ```tsx
      import {
        DndContext,
        DragOverlay,
        KeyboardSensor,
        PointerSensor,
        useSensor,
        useSensors,
        type DragEndEvent,
        type DragStartEvent,
      } from "@dnd-kit/core";
      import { useAgentChatGenerating } from "@agent-native/core/client/agent-chat";
      import {
        actionErrorMessage,
        setClientAppState,
        useActionMutation,
        useActionQuery,
      } from "@agent-native/core/client/hooks";
      import { LayoutGroup, MotionConfig } from "motion/react";
      import { useEffect, useMemo, useRef, useState } from "react";
      import { toast } from "sonner";

      import { dailyLimitMessage } from "@shared/agent-limits";
      import type { BoardCluster, BoardNote, BoardSnapshot } from "@shared/board-types";

      import { allNotes, diffAgentMoves } from "@/lib/board/agent-moves";
      import { findAutoTeachCluster } from "@/lib/board/auto-teach";
      import { UNSORTED_DROP_ID, clusterDropId, noteIdFromDragId, resolveDrop } from "@/lib/board/drop-target";
      import { buildTeachHandoff, type Handoff } from "@/lib/board/handoff";

      import { BoardTopBar } from "./BoardTopBar";
      import { ClusterColumn } from "./ClusterColumn";
      import { ClusterMenu } from "./ClusterMenu";
      import { EmptyBoard } from "./EmptyBoard";
      import { NewClusterZone } from "./NewClusterZone";
      import { SelectionBar } from "./SelectionBar";

      export const AGENT_POLL_MS = 2_000;
      export const HIGHLIGHT_MS = 6_000;
      const AUTO_TEACH_STORAGE_KEY = "stigi.autoTeach";

      function readAutoTeach(): boolean {
        try {
          return window.localStorage.getItem(AUTO_TEACH_STORAGE_KEY) !== "0";
        } catch {
          return true;
        }
      }

      function writeAutoTeach(value: boolean): void {
        try {
          window.localStorage.setItem(AUTO_TEACH_STORAGE_KEY, value ? "1" : "0");
        } catch {
          // Storage blocked (private window): the in-memory value still applies for this visit.
        }
      }

      function showError(error: unknown): void {
        toast.error(actionErrorMessage(error));
      }

      export function BoardPage() {
        const [isGenerating, sendToAgent] = useAgentChatGenerating();
        const boardQuery = useActionQuery("get-board", {}, { refetchInterval: isGenerating ? AGENT_POLL_MS : false });
        const usageQuery = useActionQuery("get-agent-usage", {}, { refetchInterval: isGenerating ? AGENT_POLL_MS * 2 : false });
        const importNotes = useActionMutation("import-notes", { onError: showError });
        const createCluster = useActionMutation("create-cluster", { onError: showError });
        const renameCluster = useActionMutation("rename-cluster", { onError: showError });
        const moveNotes = useActionMutation("move-notes", { onError: showError });

        const board: BoardSnapshot | undefined = boardQuery.data;
        const usage = usageQuery.data ?? null;

        const [autoTeach, setAutoTeach] = useState(true);
        const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());
        const [highlightedIds, setHighlightedIds] = useState<ReadonlySet<string>>(() => new Set());
        const [activeNote, setActiveNote] = useState<BoardNote | null>(null);
        const firedRef = useRef<Set<string>>(new Set());
        const previousBoardRef = useRef<BoardSnapshot | null>(null);
        const timersRef = useRef<number[]>([]);

        const notesById = useMemo(() => {
          const map = new Map<string, BoardNote>();
          if (board) for (const n of allNotes(board)) map.set(n.id, n);
          return map;
        }, [board]);
        const agentBlocked = isGenerating || (usage !== null && usage.remaining <= 0);

        useEffect(() => {
          setAutoTeach(readAutoTeach());
        }, []);

        // Selection is app-state the agent reads through view-screen (ids only, spec §7).
        useEffect(() => {
          const noteIds = [...selectedIds];
          void setClientAppState(
            "selection",
            noteIds.length > 0 ? { kind: "stigi.board", noteIds, clusterId: null, capturedAt: new Date().toISOString() } : null,
            { keepalive: true },
          );
        }, [selectedIds]);

        // Glide-in highlight: ring the notes the agent just moved for HIGHLIGHT_MS.
        useEffect(() => {
          if (!board) return;
          const moved = diffAgentMoves(previousBoardRef.current, board);
          previousBoardRef.current = board;
          if (moved.length === 0) return;
          setHighlightedIds((prev) => new Set([...prev, ...moved]));
          const timer = window.setTimeout(() => {
            setHighlightedIds((prev) => {
              const next = new Set(prev);
              for (const id of moved) next.delete(id);
              return next;
            });
          }, HIGHLIGHT_MS);
          timersRef.current.push(timer);
        }, [board]);

        useEffect(() => () => {
          for (const timer of timersRef.current) window.clearTimeout(timer);
        }, []);

        async function hasCredits(): Promise<boolean> {
          const latest = (await usageQuery.refetch()).data;
          if (latest && latest.remaining <= 0) {
            toast.error(dailyLimitMessage(latest.limit));
            return false;
          }
          return true;
        }

        function handOff(handoff: Handoff): void {
          sendToAgent({ message: handoff.message, context: handoff.context, submit: true, openSidebar: true });
        }

        async function teach(cluster: Pick<BoardCluster, "id" | "notes">): Promise<void> {
          firedRef.current.add(cluster.id);
          if (!(await hasCredits())) return;
          handOff(buildTeachHandoff(cluster));
        }

        // Spec D7: auto-teach once a user-made untitled cluster has two seeds.
        useEffect(() => {
          if (!board || !autoTeach || isGenerating) return;
          const cluster = findAutoTeachCluster(board, firedRef.current);
          if (cluster) void teach(cluster);
        }, [board, autoTeach, isGenerating]);

        const sensors = useSensors(
          useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
          useSensor(KeyboardSensor),
        );

        function onDragStart(event: DragStartEvent): void {
          setActiveNote(notesById.get(noteIdFromDragId(String(event.active.id))) ?? null);
        }

        function onDragEnd(event: DragEndEvent): void {
          setActiveNote(null);
          const noteId = noteIdFromDragId(String(event.active.id));
          const note = notesById.get(noteId);
          if (!note) return;
          const action = resolveDrop(noteId, note.clusterId, event.over ? String(event.over.id) : null);
          if (action.kind === "create-cluster") createCluster.mutate({ noteIds: [action.noteId] });
          if (action.kind === "move") moveNotes.mutate({ moves: [{ noteId: action.noteId, clusterId: action.clusterId }] });
        }

        function toggleSelect(noteId: string): void {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(noteId)) next.delete(noteId);
            else next.add(noteId);
            return next;
          });
        }

        async function moreLikeSelection(): Promise<void> {
          const noteIds = [...selectedIds];
          if (noteIds.length < 2) return;
          try {
            const created = await createCluster.mutateAsync({ noteIds });
            setSelectedIds(new Set());
            if (autoTeach) return; // the auto-teach effect picks up the new untitled two-seed cluster
            const seeds = noteIds.map((id) => notesById.get(id)).filter((n): n is BoardNote => n !== undefined);
            await teach({ id: created.id, notes: seeds });
          } catch {
            // onError already showed a toast.
          }
        }

        function loadSample(): void {
          importNotes.mutate({ sample: true }, {
            onSuccess: () => toast.success("Loaded 200 sample notes (pre-sorted starting layout)."),
          });
        }

        function changeAutoTeach(value: boolean): void {
          setAutoTeach(value);
          writeAutoTeach(value);
        }

        return (
          <MotionConfig reducedMotion="user">
            <div className="stigi" data-agent-state={isGenerating ? "running" : "idle"}>
              <BoardTopBar
                totalNotes={board?.totalNotes ?? 0}
                themeCount={board?.clusters.length ?? 0}
                unsortedCount={board?.unsorted.length ?? 0}
                sampleNotes={board?.sampleNotes ?? 0}
                usage={usage}
                agentRunning={isGenerating}
                autoTeach={autoTeach}
                onAutoTeachChange={changeAutoTeach}
                sorting={false}
                onSortToggle={null}
                onImportCsv={null}
                onOpenReport={null}
                onResetBoard={null}
              />
              {board === undefined ? (
                <p className="stigi-meta">Loading your board…</p>
              ) : board.totalNotes === 0 ? (
                <EmptyBoard loading={importNotes.isPending} onLoadSample={loadSample} onImportCsv={null} />
              ) : (
                <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveNote(null)}>
                  <LayoutGroup>
                    <div className="stigi-board">
                      <div className="stigi-rail">
                        <NewClusterZone />
                        <ClusterColumn
                          dropId={UNSORTED_DROP_ID}
                          clusterId={null}
                          title="Unsorted"
                          untitled={false}
                          notes={board.unsorted}
                          selectedIds={selectedIds}
                          highlightedIds={highlightedIds}
                          onToggleSelect={toggleSelect}
                          actions={null}
                        />
                      </div>
                      <div className="stigi-clusters">
                        {board.clusters.map((cluster) => (
                          <ClusterColumn
                            key={cluster.id}
                            dropId={clusterDropId(cluster.id)}
                            clusterId={cluster.id}
                            title={cluster.name ?? "Untitled"}
                            untitled={cluster.name === null}
                            notes={cluster.notes}
                            selectedIds={selectedIds}
                            highlightedIds={highlightedIds}
                            onToggleSelect={toggleSelect}
                            actions={
                              <ClusterMenu
                                clusterName={cluster.name}
                                agentDisabled={agentBlocked || cluster.notes.length === 0}
                                onMoreLikeThese={() => void teach(cluster)}
                                onRename={(name) => renameCluster.mutate({ clusterId: cluster.id, name })}
                                mergeTargets={[]}
                                onMerge={null}
                                onDelete={null}
                              />
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </LayoutGroup>
                  <DragOverlay>
                    {activeNote ? (
                      <div className="stigi-note stigi-note--overlay">
                        <p className="stigi-note__body">{activeNote.body}</p>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
              <SelectionBar
                count={selectedIds.size}
                canTeach={!agentBlocked}
                onMoreLikeThese={() => void moreLikeSelection()}
                onClear={() => setSelectedIds(new Set())}
              />
            </div>
          </MotionConfig>
        );
      }
      ```

- [ ] **Step 2: Mount it in the board route with fonts and stylesheets**
      Replace the whole of `app/routes/board.tsx` with:
      ```tsx
      import { Outlet, type LinksFunction } from "react-router";

      import { BoardPage } from "@/components/board/BoardPage";
      import boardStylesHref from "@/styles/board.css?url";
      import tokensHref from "@/styles/stigi-tokens.css?url";

      const FONTS_HREF =
        "https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@400..700&family=JetBrains+Mono:wght@400..500&display=swap";

      export const links: LinksFunction = () => [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        { rel: "stylesheet", href: FONTS_HREF },
        { rel: "stylesheet", href: tokensHref },
        { rel: "stylesheet", href: boardStylesHref },
      ];

      export function meta() {
        return [{ title: "Feedback board · Stigi" }];
      }

      export default function BoardRoute() {
        return (
          <div className="stigi-route">
            <BoardPage />
            <Outlet />
          </div>
        );
      }
      ```

- [ ] **Step 3: Typecheck and re-run the board unit tests (the gate)**
      Run: `pnpm typecheck && pnpm vitest run app/lib/board app/components/board && echo BOARD_PAGE_OK`
      Expected: `Test Files  4 passed (4)` then `BOARD_PAGE_OK`

- [ ] **Step 4: Commit (kernel-performed — no agent runs this)**
      Message: `feat: add the live board page with drag-and-drop, glide-in and auto-teach`

---

### Task 32: Board drag-and-drop e2e (no LLM key)

**Files:**
- Create: `e2e/helpers/board.ts`
- Create: `e2e/board-dnd.spec.ts`

**Depends on:** Task 9, Task 31
**Effort:** high
**Provides:** `e2e/helpers/board.ts (openFreshBoard, loadSample, noteByText, column, dragTo, agentState)`, `e2e/board-dnd.spec.ts (2 tests, no LLM key)`
**Requires:** `signUpAndSignIn(page: Page, baseURL: string): Promise<TestAccount>`, `playwright projects "local" (dev server :8080) and "deployed" (STIGI_E2E_TARGET=deployed, e2e/production-url.txt)`, `<BoardPage /> (data-agent-state, 2 s polling while the agent runs, DnD, glide-in, selection app-state, auto-teach)`

Auto-teach is switched off through `localStorage["stigi.autoTeach"] = "0"`, so no agent turn runs and no key is needed. Test hooks from the UI: `[data-agent-state]` on the board root; `[data-note-id]`, `[data-cluster-id]`, `[data-moved-by]` on cards; `section[data-cluster-name]` on columns; `[data-testid="new-cluster-zone"]`.

- [ ] **Step 1: Write the board helpers**
      Create `e2e/helpers/board.ts`:
      ```ts
      import { expect, type Locator, type Page } from "@playwright/test";

      import { signUpAndSignIn } from "./auth";

      export const AUTO_TEACH_STORAGE_KEY = "stigi.autoTeach";

      export async function openFreshBoard(page: Page, baseURL: string, options: { autoTeach: boolean }): Promise<void> {
        await page.addInitScript(
          ([key, value]) => {
            window.localStorage.setItem(key, value);
          },
          [AUTO_TEACH_STORAGE_KEY, options.autoTeach ? "1" : "0"] as const,
        );
        await signUpAndSignIn(page, baseURL);
        await page.goto("/board");
        await expect(page.getByRole("heading", { name: "Feedback board" })).toBeVisible();
      }

      export async function loadSample(page: Page): Promise<void> {
        await page.getByRole("button", { name: "Load sample data (200 notes)" }).click();
        await expect(page.locator("[data-note-id]")).toHaveCount(200, { timeout: 60_000 });
        await expect(page.getByText("Sample data · pre-sorted starting layout")).toBeVisible();
      }

      export function agentState(page: Page): Locator {
        return page.locator("[data-agent-state]");
      }

      export function noteByText(page: Page, text: string): Locator {
        return page.locator("[data-note-id]", { hasText: text }).first();
      }

      export function column(page: Page, name: string): Locator {
        return page.locator(`section[data-cluster-name="${name}"]`);
      }

      /** Pointer drag that dnd-kit's PointerSensor (6 px activation) recognises. */
      export async function dragTo(page: Page, source: Locator, target: Locator): Promise<void> {
        await source.scrollIntoViewIfNeeded();
        const from = await source.boundingBox();
        const to = await target.boundingBox();
        if (!from || !to) throw new Error("dragTo: source or target is not visible");
        const startX = from.x + from.width / 2;
        const startY = from.y + from.height / 2;
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX + 12, startY + 12, { steps: 4 });
        await page.mouse.move(to.x + to.width / 2, to.y + Math.min(to.height / 2, 60), { steps: 20 });
        await page.mouse.up();
      }
      ```

- [ ] **Step 2: Write the spec**
      Create `e2e/board-dnd.spec.ts`:
      ```ts
      import { expect, test } from "@playwright/test";

      import { agentState, column, dragTo, loadSample, noteByText, openFreshBoard } from "./helpers/board";

      test.describe("board drag-and-drop (no agent)", () => {
        test("a fresh sign-up loads the pre-sorted sample, starts a cluster by drag and moves notes", async ({ page, baseURL }) => {
          await openFreshBoard(page, baseURL ?? "", { autoTeach: false });
          await loadSample(page);
          await expect(column(page, "Onboarding & setup").locator("[data-note-id]")).toHaveCount(25);
          await expect(column(page, "Unsorted").locator("[data-note-id]")).toHaveCount(50);

          await dragTo(page, noteByText(page, "which plan am I even on?"), page.getByTestId("new-cluster-zone"));
          const untitled = column(page, "Untitled");
          await expect(untitled.locator("[data-note-id]")).toHaveCount(1);
          await expect(untitled.getByText("Untitled — drop one more note to teach the agent")).toBeVisible();

          await dragTo(page, noteByText(page, "the billing page makes no sense"), untitled);
          await expect(untitled.locator("[data-note-id]")).toHaveCount(2);
          await expect(untitled.locator('[data-moved-by="user"]')).toHaveCount(2);

          await dragTo(page, noteByText(page, "the billing page makes no sense"), column(page, "Unsorted"));
          await expect(column(page, "Unsorted").locator("[data-note-id]")).toHaveCount(51);
          await expect(agentState(page)).toHaveAttribute("data-agent-state", "idle");
        });

        test("clicking notes selects them and shows the selection bar", async ({ page, baseURL }) => {
          await openFreshBoard(page, baseURL ?? "", { autoTeach: false });
          await loadSample(page);
          await noteByText(page, "which plan am I even on?").click();
          await noteByText(page, "the billing page makes no sense").click();
          await expect(page.getByText("2 selected")).toBeVisible();
          await page.getByRole("button", { name: "Clear", exact: true }).click();
          await expect(page.getByText("2 selected")).toHaveCount(0);
        });
      });
      ```

- [ ] **Step 3: Run it against the local dev server (the gate)**
      Restart any running dev server first (new routes need a restart); Playwright starts its own on port 8080.
      Run: `pnpm exec playwright test e2e/board-dnd.spec.ts --project=local`
      Expected: PASS — `2 passed`

- [ ] **Step 4: Commit (kernel-performed — no agent runs this)**
      Message: `test: add the no-key board drag-and-drop e2e`

---

### Task 33: Live money-shot e2e (needs `OPENROUTER_API_KEY`)

**Files:**
- Create: `e2e/money-shot.spec.ts`

**Depends on:** Task 24, Task 25, Task 32
**Effort:** high
**Model tier:** top
**Provides:** `e2e/money-shot.spec.ts (live, TURN_BUDGET_MS=35000, retries 1)`
**Requires:** `e2e/helpers/board.ts (openFreshBoard, loadSample, noteByText, column, dragTo, agentState)`, `agent-chat plugin: Stigi system prompt, INITIAL_TOOL_NAMES, prepareRequest daily-cap guard`, `.agents/skills/teach-cluster/SKILL.md`

Uses the user's OpenRouter key from `.env` (key operation: the task reads no secret, it only checks that the name exists). Runs on the pre-sorted sample layout with no prior sort (spec D15). **Timing flake rule:** one built-in retry; if 35 s is missed on both attempts, set `AGENT_MODEL=anthropic/claude-haiku-5.5` in `.env` and re-run — never change the flow.

- [ ] **Step 1: Make sure the local agent settings exist (names only, never values)**
      ```bash
      test "$(grep -c '^OPENROUTER_API_KEY=' .env 2>/dev/null)" -ge 1 || { echo "OPENROUTER_API_KEY missing from .env — ask the user to add it"; exit 1; }
      grep -q '^AGENT_ENGINE=' .env || printf '\nAGENT_ENGINE=ai-sdk:openrouter\n' >> .env
      grep -q '^AGENT_MODEL=' .env || printf 'AGENT_MODEL=anthropic/claude-sonnet-5.5\n' >> .env
      grep -q '^AGENT_ENGINE_PREFER_BYO_KEY=' .env || printf 'AGENT_ENGINE_PREFER_BYO_KEY=1\n' >> .env
      grep -q '^STIGI_DAILY_AGENT_TURNS=' .env || printf 'STIGI_DAILY_AGENT_TURNS=40\n' >> .env
      ```
      `.env` is git-ignored and is never committed or printed.

- [ ] **Step 2: Write the spec**
      Create `e2e/money-shot.spec.ts`:
      ```ts
      import { expect, test } from "@playwright/test";

      import { agentState, column, dragTo, loadSample, noteByText, openFreshBoard } from "./helpers/board";

      export const TURN_BUDGET_MS = 35_000;

      test.describe.configure({ retries: 1 });

      test("two drags teach the agent a theme and matching notes glide in with reasons", async ({ page, baseURL }) => {
        test.setTimeout(240_000);
        await openFreshBoard(page, baseURL ?? "", { autoTeach: true });
        await loadSample(page);
        await page.evaluate(() => {
          (window as unknown as { __stigiLoadMarker: string }).__stigiLoadMarker = "money-shot";
        });

        await dragTo(page, noteByText(page, "which plan am I even on?"), page.getByTestId("new-cluster-zone"));
        const untitled = column(page, "Untitled");
        await expect(untitled.locator("[data-note-id]")).toHaveCount(1);
        await dragTo(page, noteByText(page, "the billing page makes no sense"), untitled);
        const startedAt = Date.now();

        // The second seed makes the UI hand off to the agent automatically (no prompt typed).
        await expect(agentState(page)).toHaveAttribute("data-agent-state", "running", { timeout: 15_000 });

        const seed = page.locator("[data-note-id]", { hasText: "which plan am I even on?" }).first();
        const states: string[] = [];
        while (Date.now() - startedAt < TURN_BUDGET_MS + 20_000) {
          const clusterId = await seed.getAttribute("data-cluster-id");
          const taughtColumn = page.locator(`section[data-cluster-id="${clusterId}"]`);
          const signature = `${await taughtColumn.getAttribute("data-cluster-name")}|${await taughtColumn.locator("[data-note-id]").count()}`;
          if (states[states.length - 1] !== signature) states.push(signature);
          if ((await agentState(page).getAttribute("data-agent-state")) === "idle") break;
          await page.waitForTimeout(500);
        }
        const elapsed = Date.now() - startedAt;
        expect(elapsed, `teach turn took ${elapsed} ms`).toBeLessThan(TURN_BUDGET_MS);

        const clusterId = await seed.getAttribute("data-cluster-id");
        const taught = page.locator(`section[data-cluster-id="${clusterId}"]`);
        await expect(taught).not.toHaveAttribute("data-cluster-name", "Untitled");
        // The run-end refetch may land just after the idle flip: poll instead of a one-shot count.
        await expect.poll(() => taught.locator('[data-moved-by="agent"]').count(), { timeout: 10_000 }).toBeGreaterThanOrEqual(6);
        for (const reason of await taught.locator(".stigi-note__reason").allInnerTexts()) {
          expect(reason.replace(/^Agent:\s*/, "").trim().length).toBeGreaterThan(3);
        }
        expect(states.length, `board states seen during the turn: ${states.join(" -> ")}`).toBeGreaterThanOrEqual(3);
        expect(await page.evaluate(() => (window as unknown as { __stigiLoadMarker?: string }).__stigiLoadMarker)).toBe("money-shot");
      });
      ```

- [ ] **Step 3: Run the money shot locally (the gate)**
      Restart any running dev server first so it loads `.env`; Playwright starts its own on port 8080.
      Run: `pnpm exec playwright test e2e/money-shot.spec.ts --project=local`
      Expected: exit code 0 — `1 passed` (or `1 flaky` if the one allowed retry was used). Two misses of the 35 s budget → set `AGENT_MODEL=anthropic/claude-haiku-5.5` in `.env` and re-run; never change the flow.

- [ ] **Step 4: Commit (kernel-performed — no agent runs this)**
      Message: `test: add the live money-shot e2e with the 35 s turn budget`
