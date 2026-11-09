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
- **`Dotman-Bei/stigi`** — private. History: pipeline-created as `agent-native-hackathon-2026` → renamed `sortboard` by idea-forge Step 4 → renamed **`stigi`** by the guide on the user's request, 2026-11-08 ~22:00 WAT (verified: `gh repo view Dotman-Bei/stigi` → PRIVATE; `sortboard` URL redirects; local `origin` → stigi, `ls-remote` = HEAD). Local clone folder keeps the OLD name: `…/Hackathons/agent-native-hackathon-2026` (sibling of the kit). Every kickoff's `REPO:` uses `Dotman-Bei/stigi`.
- **Product name: Stigi** (from *stigmergy* — coordination through marks on a shared medium). Chosen by the user over Murmuro/Stigmo/Murma. The committed brief `docs/idea-forge/2026-11-08-sortboard-brief.md` keeps its filename and its working title "Sortboard" (the brief itself says the builder may rename); the architect kickoff's PROJECT line carries the new name. Collision check (DNS/npm/GitHub only, not a trademark search): npm `stigi` free, GitHub user free, stigi.com/.app/.ai no DNS records.
- Git note: this machine's default git credential helper stalled on `fetch`/`ls-remote` after the rename; `git -c credential.helper= -c "credential.helper=!gh auth git-credential" <cmd>` works.
- Kit checkout: `…/Hackathons/build-system` (origin `bitnormie01/build-system`), synced to origin/main `230bbc8` on 2026-11-08. (The prompt said `~/hackathons/build-system`; the kit actually lives in the Hackathons workspace folder — same layout, different path.)

## Tollgate
- Report: `docs/tollgate/2026-11-08-tollgate.md` (commit `1bd6ce8`, Step 0a Stage 0). Verified by the guide 2026-11-08 ~21:00 WAT against the committed file.
- **Verdicts:** 0a CLEAR · 0 CLEAR · 1 CLEAR · **2 BLOCKED — row C3 only (no `OPENROUTER_API_KEY` yet).** C1 PASS since 2026-11-09 07:05 WAT: guide upgraded Node v22.17.1 → **v22.23.4** on the user's request (official MSI, checksum + signature verified; `winget` is broken on this machine) · 2.5 skipped · 3 CLEAR (provisional; rows 5 and 7 passed in the 0a session only — Step 3 re-probes).
- Campaign rows: C2 pnpm 10.33 PASS · **C3 LLM path DECIDED: OpenRouter (`OPENROUTER_API_KEY`) — key not yet present; hard for Step 2** · **C4 Clips account — user-attested 2026-11-08 ~21:10 WAT: account created in their Chrome (guide did not verify; Step 3 re-probes, must confirm the clip stays public)**.
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

## Calendar-fit call (re-run 2026-11-09 07:05 WAT, ~25.9h to deadline; first made 2026-11-08 21:30 WAT)
- **Sortboard FITS**, as a vertical slice. Longest pole is the board (DnD + live-sync animation); everything else is CRUD actions. Build budget ~14–16h of the ~35h leaves ~6h+ slack for fixes, the Clips take and submission. No idea-forge re-run needed.
- Guard added to the architect kickoff: order plans so the money shot (drag two notes → agent names cluster → ~12 notes move) works end-to-end FIRST; report/export and polish after; stretch features flagged, never blocking.
- Risks to watch: LLM path undecided (C3); pre-1.0 framework churn (pin version); hosted agent turn ~40–60s soft timeout (sorting must be batched — the pack says continuation is supported); frontend kit is a marketing-site skill applied to an app (kit subset committed at `docs/design/frontend-kit/`, commit `4f18b8c`).
- Name: renamed to Stigi (see Project repo) — the Sortboard collision note is moot.

- **Re-check 2026-11-09 07:05 WAT:** the architect has NOT started (no new commits after `84fd950`), so the overnight gap cost ~9h. Still fits, but no slack to waste: architect → ~09:30; build ~09:30–00:00 (≤14h); fixes + Clips take + submission 00:00–03:00 on Nov 10; **hard stop: submitted by Nov 10 03:00 WAT** (≈6h before 08:59 WAT). If the architect runs past ~10:00 WAT, cut stretch scope rather than shorten QA.

## Next action
- **User, NOW:** open a fresh session at `opus` / effort `xhigh`, paste the Step 1 architect kickoff (given in chat — updated for OpenRouter + Node). Every hour of delay comes off the build budget.
- **User, in parallel (≈5 min):** create an OpenRouter API key + add credits, and put it in a git-ignored `.env` / user-level env var named `OPENROUTER_API_KEY` — never in chat or the repo. Needed before Step 2, not before Step 1.
- **Guide, when architect reports:** verify spec + plans + manifest (Stage-4 validation), submission draft, Stack requirements in the tollgate, model-tier pins; re-probe stack rows + C3 (name-presence only); recommend `checkpoint` review mode; prep Step 2.

## Open blockers
- Step 2 BLOCKED on tollgate C3 only: `OPENROUTER_API_KEY` must exist (user action). Architect must verify how the framework selects the OpenRouter engine/model and which OpenRouter model has reliable tool-calling (sorting depends on it).
- C4 Clips account user-attested; Step 3 re-probes.
