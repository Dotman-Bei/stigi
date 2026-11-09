<!-- demo-script-schema: v1 -->
# Stigi — demo script

## 0 — Production card

| field | value |
|---|---|
| Project | Stigi (feedback board agent, Agent-Native `chat` template) |
| Event | Agent-Native Hackathon (Builder.io) 2026, deadline Mon 2026-11-09 23:59 PT |
| Target length | 1:30 |
| Resolution / fps | Clips browser-tab capture, native tab size (Clips sets it); no re-encode |
| Voice | N/A: silent screen recording (mic off). Optional in-page caption banners; narration text in §4 is the caption sheet |
| Music | off |
| Wallet on camera | N/A: no wallet or Web3 in Stigi |
| Upload target | Clips (https://clips.agent-native.com), public share link, no password, no expiry, not archived. Account: the builder's own signed-in Clips account. Hybrid mode: builder starts and stops the Clips tab capture, the agent drives the app tab |
| Schema | v1 |

## 1 — Story & time budget

Prove: with no prompt typed, dragging two notes into a new cluster makes the agent name the theme and glide about a dozen matching notes in, each stamped with a one-line "Agent:" reason, on a board of labeled sample data.
Money shot: scene S3.

| criterion | weight | seconds |
|---|---|---|
| Usefulness and Execution (a complete working flow: load, teach, sort, report, export) | 40% | 36 |
| Creativity and Design (the two-note drag and the glide-in) | 20% | 18 |
| Innovation (people-and-agent teaching, no re-prompting) | 20% | 18 |
| Cleverness and Use of Agent-Native (same actions for UI and agent, agent sidebar) | 20% | 18 |

Mapping of scenes to criteria: S1 + S4 + S5 carry Usefulness and Execution (8 + 18 + 18 = 44 s, shared with the others); S3 carries Creativity and Innovation (28 s); S6 + S2 carry Cleverness and Use of Agent-Native. Total 90 s.

## 2 — Pre-flight — set up before recording

| # | item | how to verify | ✓ |
|---|---|---|---|
| 1 | App running: production, no local start. https://stigi.suitz.xyz (routes `/`, `/board`, `/board/report`) | HTTP 200 on `/`; `/board` after sign-in shows the heading "Feedback board" | |
| 2 | Demo data: one fresh demo account (builder signs up on the live site; email verification is off). Sample data is loaded ON CAMERA with "Load sample data (200 notes)". Board must be empty (zero notes, zero clusters) at "go". Sample data is always called sample data. | `/board` shows the empty state and the "Load sample data (200 notes)" button; no "Sample data" chip yet | |
| 3 | Wallet state: N/A, Stigi has no wallet or Web3 scene | N/A | N/A |
| 4 | Browser hygiene: one clean Chrome tab on the app, 100% zoom (Chrome zoom shortcuts are unsupported by the tool, so confirm it already reads 100%), no bookmarks bar, no extension popups, no other tab touched while recording. Auto-teach switch stays at its default (on, `stigi.autoTeach` not "0"). | Screenshot of the tab before "go" | |
| 5 | Desktop hygiene: notifications off, builder not touching mouse or keyboard during the do-not-disturb window, no `.env` or terminal in the captured tab (tab capture shows only the app tab). Agent credit guard: the OpenRouter key has about $5; max 4 takes at about $0.2 each; per-account cap is 40 agent turns per day; never run an agent turn outside the script | Builder confirms; the take counter in §3 stays at or below 4 | |
| 6 | Capture toolchain: Clips tab capture started by the builder; computer-use is not used in this mode (tollgate session card: row 5 PASS in this session, row 6 N-A for hybrid mode, rows 9–13 and 16 N-A). Report: `docs/tollgate/2026-11-08-tollgate.md`; the session result is in `docs/gates/2026-11-09-gate-ledger.md` | Ledger entry for this session | |
| 7 | Assets: no title card, logo or outro (silent, no assembly). Optional caption banner text is in §4. Repo URL is not shown on screen (repo is private until Step 3) | N/A | N/A |

## 3 — Shot list

| id | seconds | visual (route/action/window) | narration cue | driver | wallet verbs | gate assertion | retakes | take |
|---|---|---|---|---|---|---|---|---|
| S1 | 8 | `/board` empty state, click "Load sample data (200 notes)" | S1 "Stigi is a feedback…" | screencast | N/A | 200 notes visible and the chip "Sample data · pre-sorted starting layout" is on screen | 3 | |
| S2 | 8 | Scroll slowly across the clusters, hover the plan and billing complaints that sit in the wrong columns | S2 "Plan and billing complaints…" | screencast | N/A | At least two plan or billing notes visible in different clusters | 3 | |
| S3 | 28 | Real drag of "which plan am I even on?" onto the New cluster zone, pause, real drag of "the billing page makes no sense" onto the Untitled cluster, then wait for the agent to name it and glide notes in | S3 "Two drags, no prompt…" | screencast | N/A | Cluster no longer named "Untitled"; at least 6 notes with an "Agent:" reason chip are in it; the sample-data chip is still on screen | 3 | |
| S4 | 18 | Click "Sort with agent" once (one batch), watch unsorted notes file themselves with reasons | S4 "Sort with agent files…" | screencast | N/A | Unsorted count drops; moved notes show "Agent:" reasons | 3 | |
| S5 | 18 | Click "Report", click "Write with agent", edit one line, click "Export .md" | S5 "Then the agent writes…" | screencast | N/A | Report text present (themes, quotes, next step); an edited line visible; export triggered | 3 | |
| S6 | 10 | Open the agent sidebar and rest on it; show the agent working from the same actions as the board | S6 "Same actions, same…" | screencast | N/A | Agent sidebar visible with the thread of this session | 3 | |

Seconds sum to 90, equal to the §1 target. Pacing rule: at least 1.5 s pause after every click and 3 s after each drag so the glide-in is visible. Dead agent-wait time may be trimmed with Clips' own edit tools if it is long. Take counter (max 4 takes for the whole video, shared across scenes, because the video is recorded in one pass): see §8.

## 4 — Narration script

Silent recording. These are optional on-screen caption lines (one banner per scene, shown through the Chrome javascript tool only if cheap) and the sheet for anyone who adds a voiceover later.

**S1** — Stigi is a feedback board. This is sample data, 200 synthetic comments for a fictional expenses app.
words: 18 · planned: 8s @ ~2.4 w/s · tone: plain, matter of fact · gloss: Stigi → STEE-gee

**S2** — Plan and billing complaints are scattered across the wrong clusters.
words: 10 · planned: 8s @ ~2.4 w/s (slow scroll, extra pause) · tone: pointing out a problem · gloss: none

**S3** — Two drags, no prompt. The agent names the theme and pulls in the matching notes, each with a reason.
words: 19 · planned: 28s @ ~2.4 w/s (drag, wait and glide dominate) · tone: the payoff · gloss: none

**S4** — Sort with agent files the unsorted pile in one small batch.
words: 11 · planned: 18s @ ~2.4 w/s (agent wait) · tone: steady · gloss: none

**S5** — Then the agent writes the insight report. Edit a line, export Markdown.
words: 12 · planned: 18s @ ~2.4 w/s (agent wait) · tone: steady · gloss: Markdown → MARK-down

**S6** — Same actions, same database: the board and the agent use one set of actions.
words: 14 · planned: 10s @ ~2.4 w/s · tone: closing · gloss: none

## 5 — Assembly plan

No Remotion assembly: struck for this event (Clips is the required recorder). Order: S1 → S6 as one continuous Clips tab capture, no title card or outro. Transitions: none. Captions: optional in-page banner per scene, otherwise Clips' own auto transcript and title. Music: off. Loudness: N/A (silent). Export: not applicable; the deliverable is the public Clips share URL. Clips edit tools may trim agent-wait dead time. Mechanics: none from references/demo-stack.md (ffmpeg, Playwright and Remotion are all struck in this mode).

## 6 — QC record

| check | scene(s) | pass/fail | note |
|---|---|---|---|
| money shot visible | S3 | | |
| text legible at 1080p | all | | |
| captions present + synced | all | N/A | silent, optional banners only |
| no capture yellow border | all | N/A | Clips tab capture, no Windows.Graphics.Capture |
| no secret / no address that shouldn't be on screen | all | | the demo account email is a plausible example address; no key, token or password on screen |
| per-scene duration within budget | all | | |
| total duration within ±10% | all | | |
| audio present, loudness sane | all | N/A | silent, mic off |

## 7 — Publish block

| field | value |
|---|---|
| Upload target + account | Clips (clips.agent-native.com) — the builder's own Clips account (name not recorded here) |
| Title | Stigi: teach the agent a theme with two drags (sample data) |
| Description | Stigi is a feedback board built on Agent-Native. Drag two notes into a new cluster; the agent names the theme and moves the matching notes in with one-line reasons. Then Sort with agent, and the agent writes the insight report. Sample data throughout (200 synthetic comments for a fictional expenses app). Live app: https://stigi.suitz.xyz. Music attribution: none (no music). |
| Tags | agent-native, hackathon, feedback, clips, stigi |
| Visibility | public (Rules: "viewable without a login or access request"); no password, no expiry, not archived or trashed |
| URL | TBD |
| Verified logged-out | TBD |
| Resolves | submission-draft demo video URL |

## 8 — Status ledger

| date | event | by |
|---|---|---|
| 2026-11-09 | scripted | demo-studio |
| 2026-11-09 | approved (the builder's hybrid Clips-mode directive names this outline and orders it written and committed; no separate approval step) | the builder |
