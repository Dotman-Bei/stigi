# Runsheet — Agent-Native Hackathon (Builder.io)

_Guide seat: claude-sonnet-5-5 · tier standard · effort high (user-attested). Updated 2026-11-08 21:00 WAT (~36h left)._

## Event
- **Name / URL:** Agent-Native Hackathon — https://www.builder.io/hackathon (rules: /hackathon/rules · submit: /hackathon/submit)
- **Deadline:** **Mon 2026-11-09 23:59 PT** = 2026-11-10 07:59 UTC = **2026-11-10 08:59 WAT** (user's local tz, UTC+1). Page says all times PT.
- **Prizes:** $10,000 — 1st $5,000 · 2nd $2,500 · 3rd $1,500 · 4th $750 · 5th $250. Four *recognition categories* (no extra cash): Best Overall App, Best Productivity App, Most Creative App, Best Use of Agent-Native.
- **Judging (one rubric, verbatim weights from event page):** Usefulness & Execution 40% · Creativity & Design 20% · Innovation 20% · Cleverness & Use of Agent-Native 20%.
- **Required:** a working app built with the Agent-Native framework (agent + UI sharing the same data/actions) + a **public Clips demo** recorded by the builder + submission via the submit page.
- **Resolved by the pack (Rules are controlling):** no team-size cap stated · repo need NOT be public (public repo/live deploy "encouraged") · Clips demo is mandatory, must be recorded with Clips and viewable without login (no password/expiry; length unspecified) · "naming or importing the framework alone is not enough" · must identify pre-existing work/templates/third-party assets and what changed since Oct 27 · submit form: first name*, email*, project name*, description*, public Clips URL*, consent*; optional last name, GitHub URL, slides URL. Recording alone does not submit — confirm receipt.
- **Remaining gaps:** Clips length limit; how recognition categories are picked; whether a self-hosted Clips link counts.
- **Prior art:** no past winners. Judges compare against Builder's own first-party apps (design, slides, analytics, calendar, mail, forms, tasks, CRM, content, dispatch…) — a clone of one loses head-to-head.

## Project repo
- **`Dotman-Bei/sortboard`** — private; pipeline-created as `agent-native-hackathon-2026`, renamed by idea-forge Step 4 on 2026-11-08 (verified: `gh repo view` → Dotman-Bei/sortboard, PRIVATE, description = brief's one-liner; local `origin` → sortboard). Local clone folder keeps the OLD name: `…/Hackathons/agent-native-hackathon-2026` (sibling of the kit). Every kickoff's `REPO:` uses `Dotman-Bei/sortboard`.
- Kit checkout: `…/Hackathons/build-system` (origin `bitnormie01/build-system`), synced to origin/main `230bbc8` on 2026-11-08. (The prompt said `~/hackathons/build-system`; the kit actually lives in the Hackathons workspace folder — same layout, different path.)

## Tollgate
- Report: `docs/tollgate/2026-11-08-tollgate.md` (commit `1bd6ce8`, Step 0a Stage 0). Verified by the guide 2026-11-08 ~21:00 WAT against the committed file.
- **Verdicts:** 0a CLEAR · 0 CLEAR · 1 CLEAR · **2 BLOCKED — row C1: Node v22.17.1 < required 22.22** (user fix: `winget upgrade OpenJS.NodeJS.LTS`, then `node --version`; open a NEW shell afterwards) · 2.5 skipped · 3 CLEAR (provisional; rows 5 and 7 passed in the 0a session only — Step 3 re-probes).
- Campaign rows: C2 pnpm 10.33 PASS · **C3 LLM provider path — UNPROBED; hard for Step 2** (guide check: `ANTHROPIC_API_KEY` not set in this shell) · **C4 Clips account — user-attested 2026-11-08 ~21:10 WAT: account created in their Chrome (guide did not verify; Step 3 re-probes, must confirm the clip stays public)**.
- Routing (row 18): per-spawn effort available; top=`claude-opus-5-5`, standard=`claude-sonnet-5-5`, fast=`claude-haiku-5-5` verified; no env overrides; executor variants not installed yet (orchestrator installs at Step 2 boot).
- Note: row 7's probe opened a signed-in Gmail inbox in the user's Chrome (no mail read), as the matrix prescribes.

## Goal
- **Assumed (user left the template placeholder):** win the Grand Prize ($5,000) with an Agent-Native app; secondary: one recognition category.

## Strategy decisions
| Decision | Choice | Reason |
|---|---|---|
| Mode | guided | first campaign; ~36h clock needs a human watching each baton |
| 0a extractor | **RUN, time-boxed ~45 min** | framework is the only "sponsor SDK"; architect needs real API facts (`defineAction`, scaffold, env vars) and the unread rules/submit pages |
| 0 idea-forge | **RUN**, `safe-feasible`, 1 track set | user has no idea yet |
| 1 architect | RUN — budget ≤2h | |
| 2 orchestrator | RUN — `checkpoint` review mode recommended | |
| 2.5 demo-studio | **SKIP** | event requires a public **Clips** recording (Clips = an Agent-Native app); demo-studio's Remotion/ffmpeg pipeline doesn't produce that |
| 3 gate-concierge | closing pass only (deploy if needed, Clips signup, submit form); preflight pass only if the architect's manifest has key/fund gates | |
| Calendar fit | fits **only** as a thin vertical slice | ~36h45m left at 20:15 WAT Nov 8 |
| Track shortlist | Best Overall App · Best Use of Agent-Native · Best Productivity App | see chat strategy; no tracks exist, only recognition categories |
| Risk appetite | **safe-feasible** (user decides) | 40% weight on a complete, working experience; unfamiliar new framework; 36h |
| Sponsor depth | deep: Agent-Native docs + repo + example apps + Clips + rules + submit page · shallow: nothing else | Builder.io is the only organization on the page |

## Working schedule (WAT, UTC+1) — internal deadlines, not the event's
- Nov 8 evening: 0a (to ~21:15) → 0 (to ~22:00) → 1 architect (to ~00:00)
- Nov 9: build 08:00–18:00 → fixes + QC to 20:00 → Clips demo 20:00–21:00 → submit by 23:00
- Hard stop: submitted by **Nov 10 03:00 WAT** (≈6h slack before 08:59 WAT)

## Frontend constraint (carry into the architect kickoff)
- `docs/design/frontend.md` (copied from the design-taste-frontend skill, committed + pushed on repo creation).
- Architect kickoff **DOCS** must list `docs/design/frontend.md`; **CONSTRAINTS** must include verbatim: *"All UI follows docs/design/frontend.md. Every frontend task's code applies its tokens, type, layout and components, and its task block cites the file."*

## Step status
| Step | Status | Artifact | Verified | Seat settings |
|---|---|---|---|---|
| 0a | **done** | `docs/resources/2026-11-08-agent-native-hackathon/` (commit `134ffb0`) + tollgate `1bd6ce8` | guide read all 7 files; deadline/rubric/prizes cross-agree with rules page + guide's own earlier fetch; gaps are labelled | `claude-opus-5-5` · high (user-attested) |
| 0 | **done** | `docs/idea-forge/2026-11-08-sortboard-brief.md` (commit `3fd2910`, on origin/main) | guide read in full: all required fields present incl. Feasibility notes (transcribed from the pack); architect block carries DOCS + the frontend CONSTRAINTS line; repo rename verified | `claude-opus-5-5` · max (user-attested) |
| 1 | pending | — | — | — |
| 2 | pending | — | — | — |
| 2.5 | skipped | — | — | — |
| 3 | pending | — | — | — |

## Calendar-fit call (2026-11-08 ~21:30 WAT, ~35h to deadline)
- **Sortboard FITS**, as a vertical slice. Longest pole is the board (DnD + live-sync animation); everything else is CRUD actions. Build budget ~14–16h of the ~35h leaves ~6h+ slack for fixes, the Clips take and submission. No idea-forge re-run needed.
- Guard added to the architect kickoff: order plans so the money shot (drag two notes → agent names cluster → ~12 notes move) works end-to-end FIRST; report/export and polish after; stretch features flagged, never blocking.
- Risks to watch: LLM path undecided (C3); pre-1.0 framework churn (pin version); hosted agent turn ~40–60s soft timeout (sorting must be batched — the pack says continuation is supported); frontend kit is a marketing-site skill applied to an app (kit subset committed at `docs/design/frontend-kit/`, commit `4f18b8c`).
- Name check: "Sortboard" collides only with a 2021 Cito classroom prototype and a small GitHub lib — low risk; user may rename later.

## Next action
- **User:** (a) Node ≥22.22 upgrade (still BLOCKS Step 2 — do it during the architect dialogue); (b) open a fresh session at `opus` / effort `xhigh`, paste the Step 1 architect kickoff from chat; (c) have an answer ready for "which LLM path" (own Anthropic/OpenAI key in the git-ignored `.env`, or the Builder.io connection).
- **Guide, when architect reports:** verify spec + plans + manifest (Stage-4 validation), submission draft, Stack requirements in the tollgate, model-tier pins; re-probe stack rows; recommend `checkpoint` review mode; prep Step 2 (+ concierge preflight only if the LLM key needs a gate).

## Open blockers
- Step 2 BLOCKED on tollgate C1 (Node ≥22.22) — user action, ~5 min.
- C3 (LLM path) unresolved — hard for Step 2; architect will ask. C4 Clips account user-attested; Step 3 re-probes.
