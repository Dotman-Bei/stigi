# Sponsor: Builder.io — Clips (DEEP): the required demo recorder

| | |
|---|---|
| Hosted app | https://clips.agent-native.com/ (BETA): **sign-in wall**, observed 2026-11-08 in Chrome, not logged in |
| Product page | https://www.agent-native.com/apps/clips/ (Chrome, 2026-11-08) |
| Docs | `template-clips.mdx`, `template-clips-features.mdx`, `template-clips-developers.mdx` (repo `packages/core/docs/content/`, via `gh api` 2026-11-08) |
| Source | `templates/clips/` in BuilderIO/agent-native (MIT): self-hostable |
| Desktop app | https://clips.agent-native.com/download (macOS, Windows, Linux), per the docs |

## Why it matters

Clips is **mandatory**. Rules: "Record a public Clips demonstration showing the actual application in use.
The recording must be viewable without a login or access request." FAQ: "Every entry requires a demo recorded
with Clips. A recording made with another tool does not replace this requirement." The submit form's
required field is "Public Clips recording URL *" (`clip_url`). "Recording a clip alone does not submit an entry."

## Recording constraints (what is and isn't specified)

| Constraint | Status | Source |
|---|---|---|
| Must be made **with Clips** | **Required** | FAQ "Do I have to use Clips?" |
| Must show **the actual application in use** | **Required** | Rules, How to Enter |
| Must be **public**: viewable without login or access request | **Required** | Rules and FAQ |
| **Max / min length** | **NOT SPECIFIED** on the Rules, FAQ, submit page, or Clips docs: **gap** | — |
| Production value | Not judged: "The focus is what you built, not the production value of your recording or your social following." | FAQ, How are projects judged |
| Fabricated demos | Disqualifying: "Plagiarism, fabricated demonstrations, fraud…" | Rules, Fair Participation |

## Account requirement

- **Hosted Clips needs an account.** clips.agent-native.com shows "Welcome to Clips / Sign in or create your
  account" with **"Sign in with Google"** or **email** ("Continue with email", "Use a password instead"), and
  "By signing up, you accept our Terms and Privacy Policy". *Not logged in by this session; account state
  unknown* (tollgate row C4).
- The Rules don't explicitly say "a Clips account is required"; the account comes in through the hosted app's
  sign-in. An alternative is **self-hosting the Clips template** (it's MIT; the docs list a quick start) and
  sharing a public link from that deployment. Whether a self-hosted Clips link satisfies "public Clips
  recording" isn't addressed by the Rules: **gap / ask hackathon@builder.io if relevant**.
- Builder.io-managed AI credits power backup transcription, cleanup, titles, and summaries "including the
  free tier's credits".

## Making the recording public (template-clips-features.mdx, verbatim)

- "Share a clip with per-clip permissions: public, team/organization, or private. Link tracking and threaded
  comments work too. Add a password or an expiry date on any clip from the Share dialog."
- "**Recordings default to public unless an admin changes that**, and picking a visibility explicitly always
  wins over the default."
- Product-page FAQ: "Recordings use public links by default unless your organization changes that setting.
  Anyone with the link can access them. Private and organization access options are available, and private
  clips can be shared with agents through temporary links without making the recording public."
- ⚠ For submission, **do not add a password or expiry, and do not archive or trash the clip**: any of these
  breaks "viewable without a login or access request". (The docs' Slack-preview note lists "a password,
  expiry hit, or archive/trash marker" as non-public states.)
- Public share route: `share.$shareId.tsx`, i.e. `/share/<id>`. In-app route: `/r/<recordingId>`. Embed params:
  `?t=80`, `?autoplay=1`, `?hideControls=1`, `?loop=1`.

## How to record (docs)

- **Web app:** product-page FAQ, "No. You can record in the Clips web app. Use the Chrome extension when you
  also want console messages and network diagnostics from the tab you're demonstrating." (answering "Do I need
  the Chrome extension to record my screen?")
- **Desktop tray app** (macOS/Windows/Linux): screen + webcam with a draggable camera bubble and live
  transcription. Rewind / earlier-screen-time are off-by-default extras.
- **Chrome extension:** adds browser logs and network activity (up to five tabs).
- **Loom import:** paste a public Loom URL. *(Whether an imported Loom counts as "recorded with Clips" is
  unclear: don't rely on it.)*
- After recording, the agent auto-generates a transcript, title, summary, and chapters. Non-destructive edits
  by chat ("trim the first 10 seconds", "remove the ums and uhs"), or the one-click **Remove silences** /
  **Remove filler words**.

## Agent-readability (a possible demo angle; facts only)

"Pasting a clip's share link into Claude, ChatGPT, or another assistant lets it read the transcript and see
timestamped screen frames without downloading raw video." The developer guide shows an
action (description: "Create a temporary private agent-readable link for one Clips recording…") that builds
scoped, expiring agent links via `createScopedAgentAccessGrant()` from `@agent-native/core/server` (default
2 h, capped at 7 days).

## Clips as an Agent-Native reference app (for the architect)

Clips is itself built on the framework, so it's a worked example of actions, app state, and agent editing
(non-destructive edits, `view-screen` with the playhead, sub-agent transcript cleanup). The template has
`actions/`, `app/routes/`, `server/`, `jobs/`, `chrome-extension/`, `desktop/`, `AGENTS.md`, `DESIGN.md`. The
anonymous embed flow (`create-recording-intake-link`, `create-intake-recording`, `create-intake-agent-link`)
lets other products embed recording.

## Gaps

- No published length limit or format spec for the demo.
- Whether the user already has a Clips account (not checked: no login).
- Whether a self-hosted Clips deployment's public link is accepted.
