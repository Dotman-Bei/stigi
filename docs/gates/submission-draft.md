# Submission draft — Agent-Native Hackathon (Builder.io)

Pre-filled by the architect (Step 1, 2026-11-09) from the brief, the spec and the pack's `event.md`.
Form: https://www.builder.io/hackathon/submit · Deadline: **Mon 2026-11-09 23:59 PT = 2026-11-10 07:59 UTC = 08:59 WAT**
(Rules: "submit early and verify receipt"). Lines marked `TBD-post-build:` are build outputs: demo-studio is skipped
for this event, so the gate-concierge closing pass (Step 3) resolves all of them, including the Clips URL the builder
records. Nothing else is deferred.

## Form fields (labels and names verbatim from the submit page)

| Field (form `name`) | Required | Value |
|---|---|---|
| First name * (`firstname`) | yes | Entered by the builder at submission (personal data is not stored in the repo) |
| Last name (`lastname`) | no | Entered by the builder at submission (optional) |
| Email * (`email`) | yes | Entered by the builder at submission (personal data is not stored in the repo) |
| Project name * (`hackathon_project_name`) | yes | **Stigi** |
| Project description * (`hackathon_project_description`) | yes | The text in "Project description" below |
| Project or GitHub URL (optional) (`github_project_url`) | no | TBD-post-build:public-repo-url |
| Public Clips recording URL * (`clip_url`) | yes | TBD-post-build:clips-demo-url |
| Slides URL (optional) (`slides_url`) | no | Leave empty (no slides) |
| ☐ Official Rules / eligibility / data-processing consent * (`processingConsent`) | yes | The builder ticks it personally at submission |
| ☐ Marketing offers and updates (optional) (`marketingConsent`) | no | The builder's choice |

## Project description (paste into `hackathon_project_description`)

The form's placeholder asks for: what it does, how it uses Agent-Native, any pre-existing work, templates or
third-party assets and what changed during the event, and the names of everyone on the team.

```text
Stigi is a feedback board where an agent sorts customer comments into themes, you drag two notes to teach it, and it re-sorts the rest to match, then writes the insight report.

What it does: product teams sit on hundreds of raw comments (tickets, NPS verbatims, reviews). Stigi puts them on a board of theme clusters. When the agent groups something wrong you don't re-prompt: you drag two notes into a new cluster, and the agent names the theme, pulls every matching note in from across the board, and shows a one-line reason on each note it moved. "Sort with agent" files the unsorted pile in small batches, and the agent writes a ranked insight report (themes by size, verbatim quotes, a suggested next step) that you edit and export as Markdown.

How it uses Agent-Native: the board UI and the agent share one set of defineAction() actions (import-notes, list-notes, create-cluster, rename-cluster, move-notes, merge-clusters, delete-cluster, get-board-digest, save-report, view-screen) over one Postgres database. A drag in the UI calls move-notes; the agent calls the same move-notes as a tool, and the action refuses an agent move without a one-line reason. The user's selection is written to app-state and read by the agent's view-screen; the agent opens the report pane with a navigate command; the teach request is handed to the agent with sendToAgentChat-style hidden context (cluster id + seed notes). Agent tool calls refresh the board live (plus 2 s polling while the agent works, so it also works on serverless Vercel). Every agent turn is one small batch so it fits the hosted turn budget; sign-in is required and each account gets 40 agent turns per day.

Live app: https://stigi.suitz.xyz (sign up with any email and password). The demo and the live app use SAMPLE DATA: 200 synthetic comments for a fictional expenses app, labeled as sample in the app.

Pre-existing work and what changed: built on the Agent-Native "chat" template (@agent-native/core 0.226.0) and its @agent-native/toolkit components (app shell, agent sidebar); libraries @dnd-kit/core, motion, Drizzle, Zod, Vitest, Playwright. Everything Stigi-specific was built during the event on 2026-11-09: all board actions and their tests, the database schema, the board UI, the agent instructions and skills (teach-cluster, sort-feedback, write-report), the daily agent-turn cap, the public landing page at the site root, and the Vercel + Neon deployment setup.

Third-party assets: the design-taste-frontend design kit (design tokens, layout, motion and UI-fragment styles, the diagram renderer and the "iris-opens" scroll moment, copied into the landing page); the photograph "Tabel day 1" by Jan Kahánek, CC0, via Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Tabel_day_1_(Unsplash).jpg), credited in the landing page footer; the fonts Host Grotesk and JetBrains Mono (SIL Open Font License) via Google Fonts; Tabler Icons (MIT) in the app shell from the template; Lucide icons (ISC) in the landing page diagram. The landing page's product pictures are real screenshots of the running app with the labelled sample data. The landing page shows the real app UI with the synthetic sample comments; it has no testimonials, customer logos or invented statistics.

Team: Dotman-Bei (solo builder), building with Claude Code as an AI pair.
```

## Third-party assets (the Rules require identifying them)

| Asset | Where it is used | Licence / source |
|---|---|---|
| Agent-Native `chat` template, `@agent-native/core` 0.226.0, `@agent-native/toolkit` | The app scaffold, the app shell, the agent sidebar | MIT, BuilderIO/agent-native |
| design-taste-frontend kit files (`system.css`, `system.js`, `ui/cards.css`, `ui/base.css`, `ui/ui.js`, the `window` and `chat` UI fragments, `motion/`, `layout/`, `diagrams/`, `moments/` with `iris-opens`) | Copied into `public/landing/assets/` for the landing page; the board uses the same tokens | The builder's own design skill (copied from their local skill folder) |
| Photograph "Tabel day 1" by Jan Kahánek (kit library frame `d183`) | Landing page, section `by-hand` (a detail slot) | CC0, via Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Tabel_day_1_(Unsplash).jpg. Credited in the landing footer |
| Host Grotesk, JetBrains Mono | Board and landing typography | SIL Open Font License, via Google Fonts |
| Tabler Icons | App shell and board menus (from the template) | MIT |
| Lucide line icons (`ui-user`, `ui-layers`, `ui-database`, `ui-message-square`, `ui-refresh-cw`) | Landing page diagram, fetched by the kit's `icons.mjs` | ISC, Lucide Contributors |
| Screenshots of Stigi's own board (sample data) | Landing page pictures | Captured from the running app by `e2e-landing/capture-screenshots.e2e.ts`: our own UI, no mock-ups |
| @dnd-kit/core 6.3.1, motion 14.10.1, Drizzle ORM, Zod, Vitest, Playwright, Vercel CLI | Drag-and-drop, layout animation, data, tests, deploy | MIT / Apache-2.0 (npm) |

## Facts the closing pass resolves

- TBD-post-build:clips-demo-url
- ~~TBD-post-build:live-app-url~~ resolved 2026-11-09: https://stigi.suitz.xyz (from `e2e/production-url.txt`; deploy:12 gate 3 passed there; final once deploy:52 passes)
- TBD-post-build:public-repo-url

Sources: the Clips URL comes from the builder's public Clips recording (no password, no expiry, not archived;
Rules: "viewable without a login or access request"). The live URL is `e2e/production-url.txt`, written by
`deploy:12`, and is final after `deploy:52` (M3) passes. The public repo URL is
`https://github.com/Dotman-Bei/stigi` once the builder consents to the Step-3 repo-public flip.

## Clips demo outline (for the builder; about 90 seconds of the real app, sample data visible)

1. Sign up on the live URL, open **Feedback board**, click **Load sample data (200 notes)**. The chip reads "Sample
   data · pre-sorted starting layout".
2. Point at the plan and billing complaints scattered across the wrong clusters.
3. **Money shot:** drag "which plan am I even on?" onto **New cluster**, then drag "the billing page makes no sense"
   onto it. The agent names it (e.g. "Plan & billing confusion") and about 12 notes glide in, each with an "Agent:"
   reason chip. No prompt is typed.
4. Click **Sort with agent**: one batch of unsorted notes files itself with reasons.
5. Click **Report**, then **Write with agent**. Edit a line, then **Export .md**.
6. Close on the agent sidebar: the same actions the UI uses.

## Submission checklist (Step 3)

- [ ] `deploy:52` (M3) passed. The live app is up and the full production suite is green.
- [ ] Clips recording is public: no password, no expiry, not archived or trashed.
- [ ] Repo-public flip done with the builder's consent, or the URL field left empty.
- [ ] All three TBD lines resolved here and in `README.md`.
- [ ] Form submitted, and receipt confirmed before 2026-11-10 07:59 UTC.
