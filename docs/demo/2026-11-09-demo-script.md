<!-- demo-script-schema: v1 -->
# Stigi — demo script

## 0 — Production card

| field | value |
|---|---|
| Project | Stigi (feedback board agent, Agent-Native `chat` template) |
| Event | Agent-Native Hackathon (Builder.io) 2026, deadline Mon 2026-11-09 23:59 PT (= 2026-11-10 07:59 UTC) |
| Target length | 1:30 (rendered cut: 1:38, +9%) |
| Resolution / fps | 1920×1080 @ 30 |
| Voice | Kokoro 0.9.4, voice `af_heart`, English, local (word-timed captions from `result.tokens`) |
| Music | off |
| Wallet on camera | N/A: no wallet or Web3 in Stigi |
| Upload target | Clips library upload (https://clips.agent-native.com, Library → Import video), public share link. This is an UPLOAD of a rendered MP4, not a Clips screen recording. Account: the builder's own signed-in Clips account. Not YouTube |
| Schema | v1 |

## 1 — Story & time budget

Prove: with no prompt typed, dragging two notes into a new cluster makes the agent name the theme and glide a dozen matching notes in, each stamped with a one-line "Agent:" reason, on a board of labeled sample data.
Money shot: scene S3.

| criterion | weight | seconds |
|---|---|---|
| Usefulness and Execution (a complete working flow: load, teach, sort, report, export) | 40% | 36 |
| Creativity and Design (the two-note drag and the glide-in) | 20% | 18 |
| Innovation (people-and-agent teaching, no re-prompting) | 20% | 18 |
| Cleverness and Use of Agent-Native (same actions for UI and agent, agent sidebar) | 20% | 18 |

Scene mapping: S1 + S4 + S5 carry Usefulness and Execution; S3 carries Creativity and Innovation (the longest scene, 29 s, with the agent wait sped up and the glide-in at 1x); S6 and the agent sidebar visible from S3 on carry Cleverness and Use of Agent-Native.

## 2 — Pre-flight — set up before recording

| # | item | how to verify | ✓ |
|---|---|---|---|
| 1 | App running: production, no local start. https://stigi.suitz.xyz (`/board`) | `node demo/capture/check.mjs` loads `/board` signed in (no agent turn) | ✓ 2026-11-10 |
| 2 | Demo data: a demo account the builder signed in once (the session is saved to the git-ignored `demo/capture/auth.json`; no password is handled by the agent). The board is reset through the app's Reset board button (authorized by the builder for this demo account) so the empty state and "Load sample data (200 notes)" are recorded on camera. All sample data is labeled as sample data | `demo/capture/record.mjs` preflight: empty board, 40 of 40 agent turns left, else the take aborts before the screencast | ✓ take 3 |
| 3 | Wallet state: N/A, Stigi has no wallet or Web3 scene | N/A | N/A |
| 4 | Browser hygiene: headless Chromium (Playwright 1.65.0), fresh context, 1920×1080 viewport, device scale 1, no extensions. The signed-in account's name and address are blurred in the capture only (init script, app and data untouched) | Frames sampled in §6 show the blurred account block | ✓ |
| 5 | Desktop hygiene: the recording is headless, so the desktop is not captured and no secret can reach a frame. Agent credit guard: the OpenRouter key has about $5; at most 4 takes at about $0.2 each; per-account cap 40 agent turns per day; the recorder fails fast if the agent does not start | Take counter in §8 | ✓ |
| 6 | Capture toolchain: tollgate session card for 2.5 in this mode. Row 5 (Chrome extension) PASS this session (needed for the Clips upload); rows 9 (Node 22.23.4), 10 (ffmpeg 9.0.2 with `gfxcapture`), 11 (Python 3.12.3) and 16 (88 GB free) PASS; rows 6 and 13 N-A. Details: `docs/gates/2026-11-09-gate-ledger.md`, report `docs/tollgate/2026-11-08-tollgate.md` | Ledger entry | ✓ |
| 7 | Assets: title card = `docs/brand/logo/svg/stigi-logo-white.svg` on olive #38450f; outro = `stigi-wordmark.svg` on bone #ecebe7 (copied to `demo/public/brand/`); music N/A | Files present | ✓ |

## 3 — Shot list

| id | seconds | visual (route/action/window) | narration cue | driver | wallet verbs | gate assertion | retakes | take |
|---|---|---|---|---|---|---|---|---|
| T0 | 6 | Title card: white logo lockup on olive, tagline | T0 "Stigi. A feedback…" | N/A (Remotion card) | N/A | Logo and tagline legible | 3 | 1 |
| S1 | 8 | `/board` empty state, click "Load sample data (200 notes)"; the sample-data chip appears | S1 "This is sample…" | screencast | N/A | 200 notes visible and the chip "Sample data · pre-sorted starting layout" on screen | 3 | 3 |
| S2 | 8 | Scroll the clusters, hover the plan and billing complaints that sit in the wrong columns | S2 "But the plan…" | screencast | N/A | Both seed notes ("the billing page makes no sense", "which plan am I even on?") shown in different clusters | 3 | 3 |
| S3 | 29 | Real pointer drag of "which plan am I even on?" onto New cluster, then of "the billing page makes no sense" onto Untitled; the agent names the cluster and notes glide in (agent wait sped up 6x, glide-in at 1x) | S3a "Drag one onto…", S3b "The agent names…" | screencast | N/A | Cluster renamed (not "Untitled") and at least 6 notes with an "Agent:" reason chip are in it | 3 | 3 |
| S4 | 14 | Click "Sort with agent", one batch only ("Stop sorting" after the first batch lands) | S4 "Sort with agent…" | screencast | N/A | Unsorted count drops (48 → 23 in the final take) | 3 | 3 |
| S5 | 22 | Click "Report", "Write with agent", edit one line, "Export .md" | S5 "Then the agent…" | screencast | N/A | Report text present, an edited line visible, export download fired | 3 | 3 |
| S6 | 6 | Rest on the report with the agent sidebar open (same actions as the board) | S6 "The board and…" | screencast | N/A | Agent sidebar visible with this session's thread | 3 | 3 |
| O1 | 5 | Outro: colour wordmark on bone, live URL, sample-data note | O1 "Stigi. Live at…" | N/A (Remotion card) | N/A | Wordmark and URL legible | 3 | 1 |

Seconds sum to 98, within +9% of the 90 s target. The raw capture is one continuous session (130 s) cut into scenes by markers (`demo/capture/raw/take-3/markers.json`). Takes 1 and 2 aborted before any agent turn (a drag-targeting bug in the recorder, fixed), take 3 is the recorded cut.

## 4 — Narration script

Single source of the words: `demo/narration.json` (kept identical to this section). Spoken by Kokoro, `af_heart`.

**T0** — Stigi. A feedback board where you teach an agent by dragging two notes.
words: 13 · planned: 4.5s @ ~2.4 w/s (rendered 4.6 s) · tone: plain · gloss: Stigi → STEE-gee

**S1** — This is sample data: two hundred synthetic comments for a fictional expenses app, already filed into themes.
words: 17 · planned: 8s @ ~2.4 w/s (rendered 7.2 s) · tone: matter of fact · gloss: none

**S2** — But the plan and billing complaints are scattered across the wrong clusters.
words: 12 · planned: 5s @ ~2.4 w/s (rendered 4.4 s) · tone: pointing out a problem · gloss: none

**S3a** — Drag one onto New cluster. Drag a second. No prompt.
words: 10 · planned: 4s @ ~2.4 w/s (rendered 4.2 s) · tone: brisk · gloss: none

**S3b** — The agent names the theme, and pulls in every matching note, each with a one-line reason.
words: 16 · planned: 7s @ ~2.4 w/s (rendered 5.9 s) · tone: the payoff · gloss: none

**S4** — Sort with agent files the unsorted pile in one small batch.
words: 11 · planned: 4.6s @ ~2.4 w/s (rendered 4.2 s) · tone: steady · gloss: none

**S5** — Then the agent writes the insight report. Edit a line, and export Markdown.
words: 13 · planned: 5.8s @ ~2.4 w/s (rendered 5.2 s) · tone: steady · gloss: Markdown → MARK-down

**S6** — The board and the agent use the same actions, over one database.
words: 12 · planned: 5s @ ~2.4 w/s (rendered 4.5 s) · tone: closing · gloss: none

**O1** — Stigi. Live at stigi dot suitz dot x y z.
words: 10 · planned: 3.3s @ ~2.4 w/s (rendered 3.4 s) · tone: closing · gloss: stigi.suitz.xyz → "stigi dot suitz dot x y z"

## 5 — Assembly plan

Order: title card (T0) → S1 → S2 → S3 → S4 → S5 → S6 → outro (O1). Transitions: hard cuts. Captions: on, word-timed (Kokoro token timings), one line at a time, bone text on a dark rounded pill at the bottom, active word bold. A persistent bottom-left pill "Sample data · synthetic comments, fictional expenses app" is on every app scene (from the moment the data loads in S1). Agent-wait stretches play at up to 6x; the money-shot glide-in plays at 1x; no scene shorter than its narration plus 0.9 s. Music: off. Loudness: two-pass loudnorm to −14 LUFS (measured −14.3 LUFS, true peak −1.4 dBTP). Export: 1080p h264 (CRF 18) with AAC 192k. Capture is Playwright `page.screencast` (webm, re-encoded to constant 30 fps), assembly is Remotion 4.0.542 under `demo/`. Mechanics: references/demo-stack.md.

## 6 — QC record

| check | scene(s) | pass/fail | note |
|---|---|---|---|
| money shot visible | S3 | pass | Frames at 26 s, 38 s, 44 s, 50 s of the cut show the drag, the "Agent working…" pill, then "Plan & billing confusion" with 14 notes and "Agent:" reason chips; the sample-data chip is on screen throughout |
| text legible at 1080p | all | pass | Board text, captions and cards read clearly in the sampled frames |
| captions present + synced | all | pass | Word-highlighted captions match the narration; S3b is anchored to the glide-in |
| no capture yellow border | all | N/A | Playwright page capture, no Windows.Graphics.Capture |
| no secret / no address that shouldn't be on screen | all | pass | The signed-in account's name and address are blurred in every frame (sidebar bottom-left); no key, token or password appears. An earlier take showed the unblurred address and was aborted |
| per-scene duration within budget | all | pass | T0 5.8 s, S1 8.5 s, S2 8.3 s, S3 29.3 s, S4 13.5 s, S5 22.5 s, S6 5.7 s, O1 4.7 s |
| total duration within ±10% | all | pass | 98.3 s against 90 s (+9.2%) |
| audio present, loudness sane | all | pass | −14.3 LUFS integrated, −1.4 dBTP, after the two-pass normalise (first render was −22.9 LUFS) |

## 7 — Publish block

| field | value |
|---|---|
| Upload target + account | Clips library upload — the builder's own Clips account (name not recorded here). The clip is an uploaded MP4, not a Clips screen recording |
| Title | Stigi: teach the agent a theme with two drags (sample data) |
| Description | Stigi is a feedback board built on Agent-Native. Drag two notes into a new cluster; the agent names the theme and moves the matching notes in with one-line reasons. Then Sort with agent, and the agent writes the insight report. Sample data throughout (200 synthetic comments for a fictional expenses app). Live app: https://stigi.suitz.xyz. Music attribution: none (no music). Narration: Kokoro (local TTS). |
| Tags | agent-native, hackathon, feedback, stigi |
| Visibility | public (Rules: "viewable without a login or access request"); no password, no expiry, not archived or trashed |
| URL | https://clips.agent-native.com/share/xcUFzqFhqqei |
| Verified logged-out | 2026-11-10 (curl HTTP 200 with the clip's own title; fresh-context Chrome load shows the video at 98.3 s and no sign-in wall) |
| Resolves | submission-draft demo video URL |

## 8 — Status ledger

| date | event | by |
|---|---|---|
| 2026-11-09 | scripted | demo-studio |
| 2026-11-09 | approved (hybrid Clips-mode outline, written and committed on the builder's directive) | the builder |
| 2026-11-10 | superseded-edit (mode change to native demo-studio: Playwright capture, Kokoro narration, Remotion assembly, upload to the Clips library; title card and outro added, §§0–5 and §7 rewritten) | demo-studio |
| 2026-11-10 | approved (the builder's mode-change directive of 2026-11-10 names the revised plan and orders it run) | the builder |
| 2026-11-10 | pre-flight verified | demo-studio |
| 2026-11-10 | recorded (6/6 scenes; takes 1 and 2 aborted before any agent turn, take 3 final) | demo-studio |
| 2026-11-10 | assembled (Remotion 4.0.542, 98.3 s, −14.3 LUFS) | demo-studio |
| 2026-11-10 | QC passed (frames pulled from the served clip at 10 timestamps and the Clips transcript read; residuals: none) | demo-studio |
| 2026-11-10 | uploaded (https://clips.agent-native.com/share/xcUFzqFhqqei; Clips library upload, not a Clips recording) | demo-studio |
