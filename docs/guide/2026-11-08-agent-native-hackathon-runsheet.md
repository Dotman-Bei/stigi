# Runsheet — Agent-Native Hackathon (Builder.io)

_Guide seat: claude-sonnet-5-5 · tier standard · effort high (user-attested). Updated 2026-11-08 20:30 WAT._

## Event
- **Name / URL:** Agent-Native Hackathon — https://www.builder.io/hackathon (rules: /hackathon/rules · submit: /hackathon/submit)
- **Deadline:** **Mon 2026-11-09 23:59 PT** = 2026-11-10 07:59 UTC = **2026-11-10 08:59 WAT** (user's local tz, UTC+1). Page says all times PT.
- **Prizes:** $10,000 — 1st $5,000 · 2nd $2,500 · 3rd $1,500 · 4th $750 · 5th $250. Four *recognition categories* (no extra cash): Best Overall App, Best Productivity App, Most Creative App, Best Use of Agent-Native.
- **Judging (one rubric, verbatim weights from event page):** Usefulness & Execution 40% · Creativity & Design 20% · Innovation 20% · Cleverness & Use of Agent-Native 20%.
- **Required:** a working app built with the Agent-Native framework (agent + UI sharing the same data/actions) + a **public Clips demo** recorded by the builder + submission via the submit page.
- **Unverified (page only; rules/submit pages NOT yet read):** team-size cap, submission form fields, public-repo requirement, Clips account requirement. → Step 0a must capture these.
- Source: event page fetched 2026-11-08 by the guide's helper subagent (single fetch, HTTP 200).

## Project repo
- `Dotman-Bei/agent-native-hackathon-2026` — **private**, pipeline-created by the guide per `references/repo-bootstrap.md` (event-named form). Clone: `…/Hackathons/agent-native-hackathon-2026`, sibling of the kit.
- Expect the rename to `<project-slug>` at idea-forge Step 4; update this line + every later `REPO:` when it happens.
- Kit checkout: `…/Hackathons/build-system` (origin `bitnormie01/build-system`), synced to origin/main `230bbc8` on 2026-11-08. (The prompt said `~/hackathons/build-system`; the kit actually lives in the Hackathons workspace folder — same layout, different path.)

## Tollgate
- **No report yet** — Step 0a's Stage 0 creates `docs/tollgate/2026-11-08-tollgate.md`.
- Guide preflight, 2026-11-08 (read-only): row 1 git 2.54 + identity set — PASS · row 2 gh logged in as Dotman-Bei — PASS · row 3 kit at origin/main — PASS · row 4 repo created — PASS · row 9 Node v22.17.1 / npm 10.9.2 — PASS · row 16 ~92 GB free — PASS · row 18 env: `CLAUDE_CODE_EFFORT_LEVEL`, `…SUBAGENT_MODEL_FORCE`, `…SUBAGENT_MODEL` all unset — no routing warnings.
- Row 5 (claude-in-chrome) is session-scoped: **not asserted** — the 0a session must have the extension connected and re-probes it itself.
- Strategy strikes (so Stage 0 marks N-A): Step 2.5 rows 10–13 & 16 (demo-studio skipped), wallet rows 6/8/12 (no Web3).
- Verdicts: 0a: pending Stage 0 · others: pending.

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
| 0a | pending | — | — | — |
| 0 | pending | — | — | — |
| 1 | pending | — | — | — |
| 2 | pending | — | — | — |
| 2.5 | skipped | — | — | — |
| 3 | pending | — | — | — |

## Next action
- **User:** open a fresh session at `opus` / effort `high`, connect the Chrome extension, paste the Step 0a kickoff (given in chat).

## Open blockers
- Goal / skills left as template placeholders — assumed (TypeScript/React). User to confirm or correct.
- Rules + submit pages unread (team cap, submission fields, public-repo, Clips account) — resolved by 0a.
