# Gate ledger — Stigi (Agent-Native Hackathon)

One ledger per campaign: extend, never fork. Created 2026-11-09 by demo-studio (Step 2.5) because no ledger existed
yet. The gate-concierge (Step 3) extends this file.

## Demo video (Step 2.5) — native demo-studio, uploaded to the Clips library

> **FLAG FOR THE CLOSING PASS: the Clips clip is an UPLOAD, not a Clips recording.** The Rules say "Every entry
> requires a demo recorded with Clips. A recording made with another tool does not replace this requirement."
> The video was recorded with Playwright, narrated with Kokoro, assembled with Remotion, and then uploaded to the
> builder's Clips library (Library → Import video → Upload video). Whether an uploaded video counts as "recorded
> with Clips" is not settled by the Rules (the sponsor note flags the same question for Loom imports). The closing
> pass should decide whether to also add a real Clips screen recording and swap or add that URL.

| Item | Value |
|---|---|
| Mode history | 1) Clips-hybrid (builder starts a Clips tab capture, agent drives the app): one attempt on 2026-11-09, failed (the auto-teach hand-off never started), no clip. 2) On 2026-11-10 the builder switched to native demo-studio: Playwright capture, Kokoro narration, Remotion assembly, upload to the Clips library. Struck: ffmpeg screen capture, music, YouTube, ElevenLabs |
| Script | `docs/demo/2026-11-09-demo-script.md` (schema v1, revised in place on 2026-11-10; the `superseded-edit` row is in its §8) |
| Project | `demo/` (Remotion 4.0.542, Playwright 1.65.0, Kokoro 0.9.4; node_modules, captures, audio and renders are git-ignored) |
| Rendered files (local, git-ignored) | Master: `demo/out/stigi-demo-final.mp4`, 1920×1080 @ 30, 98.3 s, 16.2 MB, sha256 `77b69a76b20fc00450a5e1eb32fd281913ca485ccf6e1e78335ab39041a2c731`. Upload copy (under the Chrome upload tool's 10 MB cap): `demo/out/stigi-demo-upload.mp4`, 6.5 MB, sha256 `371f5c54844629bc9940dae7c05cf5169d9dd5fed43a0998f557619684cc413d` |
| Clips URL | https://clips.agent-native.com/share/xcUFzqFhqqei (in-app route `/r/xcUFzqFhqqei`) |
| Target app | https://stigi.suitz.xyz (production, Claude via OpenRouter; key had about $5) |
| Demo account | Signed in once by the builder; the session lives in the git-ignored `demo/capture/auth.json`. The recorder blurs the account name and address in the capture |
| Watch policy | The builder's waiver of 2026-11-09: no watch before publish; independent QC instead (below); the builder watches afterwards and can ask for a retake |

### Evidence

| Date | Event | Detail |
|---|---|---|
| 2026-11-09 | tollgate session card (first attempt) | Row 5 PASS (Chrome responded). Row 6 (computer-use) FAIL: no desktop computer-use tool existed in that session, so the Clips-recording mode stopped. Hybrid mode then failed on the app side (see Mode history) |
| 2026-11-10 | tollgate session card (native mode) | Row 5: extension was disconnected when first probed, then reconnected and PASS (Clips upload done through it). Row 9 PASS (Node v22.23.4, npm 10.9.9). Row 10 PASS (ffmpeg 9.0.2-essentials gyan.dev, `gfxcapture` present; nvenc/amf/qsv encoders listed, software x264 used). Row 11 PASS (Python 3.12.3). Row 16 PASS (88 GB free). Rows 6 and 13 N-A. Session-scoped; not valid for any later session |
| 2026-11-10 | recording takes | 3 of 4 used. Take 1 aborted before any agent turn (the recorder's drag overshot because the page was still smooth-scrolling). Take 2 aborted before any agent turn (the drag landed off target after an auto-scroll; the account's real address was also visible, which led to the capture-side blur). Take 3 is the final cut: the agent named the cluster "Plan & billing confusion" and moved 14 notes in; Sort with agent took Unsorted from 48 to 23; the report was written and exported. Agent turns used in take 3: 3 (teach, one sort batch, report) |
| 2026-11-10 | board reset | With the builder's yes in chat, the demo account's board was reset twice through the app's own Reset board button (two clicks) so the empty state is on camera. Only synthetic sample notes were deleted |
| 2026-11-10 | voice and captions | Kokoro `af_heart`, English, local; word timings from `result.tokens`. Narration text is `demo/narration.json` (same words as §4 of the script) |
| 2026-11-10 | assembly and loudness | Remotion render 98.3 s (+9% of the 90 s target). Loudness two-pass: −22.9 LUFS measured, normalised to −14.3 LUFS integrated, −1.4 dBTP |
| 2026-11-10 | upload | Chrome upload tool, Library → Import video → file `stigi-demo-upload.mp4` (6.3 MB). Clips saved it as "stigi-demo-upload", 1:38, owner the builder. Title edited to "Stigi: teach the agent a theme with two drags (sample data)". Clips' auto summary misheard the name ("Stiggy", wrong URL "stiggy.suits.xyz"), so the description was replaced with the approved publish copy through the Clips agent (second attempt worked). Default playback speed changed from 1.2x to 1x. Visibility: Anyone with the link can view, No password, Never expires; not archived or trashed |
| 2026-11-10 | independent QC (public, logged out) | Plain `curl` of `/share/xcUFzqFhqqei`: HTTP 200, no redirect, `<title>` the clip's own title, og:description present. Logged-out headless Chrome load (fresh context): HTTP 200, `<video>` present with duration 98.3 s, no "Sign in" wall. Clips' public agent-readable context (`/api/agent-context.json?id=xcUFzqFhqqei`, HTTP 200) lists the transcript and frames; the transcript matches the narration (ASR spells the name "Stiggy"). Frames pulled from the served clip (`/api/agent-frame.jpg`, HTTP 200) at 3, 12, 20, 28, 44, 50, 54, 66, 82 and 96 s: title card; sample-data chip visible from the load on; the drag; "Agent working…"; "Plan & billing confusion" with 14 notes and "Agent:" reason chips (money shot at 50–54 s); the sort (23 unsorted); the report; the outro. The signed-in account's name and address are blurred in every frame. Residuals: none that fail a check; the audio is Kokoro's synthetic voice; the first-frame still of the Clips thumbnail is the olive title card |
