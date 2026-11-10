# Stigi: drag two notes, and an agent sorts the rest of your customer feedback

Picture a product manager with a spreadsheet of 200 customer comments: support tickets, NPS verbatims, app-store reviews. They need themes by Friday, so they start grouping the comments into clusters by hand.

An hour in, they notice two comments sitting in the wrong columns: "which plan am I even on?" and "the billing page makes no sense". Both are about billing confusion. So are about a dozen others, scattered across every cluster.

Pasting the pile into an AI chat doesn't fix it. They get a summary they can't correct. Fix one grouping by hand and the rest of the pile stays wrong, so the only move left is to re-prompt from scratch.

That's the gap I built Stigi for.

## What Stigi is

Stigi is a feedback board where an agent sorts customer comments into themes. When it groups something wrong, you drag two notes together. The agent names the theme, pulls every matching note in from across the board, and writes a one-line reason on each note it moved. Then it writes the insight report.

The correction is the instruction. You never write a prompt.

## How it works

1. Sign up at stigi.suitz.xyz with any email and password.
2. Click **Load sample data (200 notes)**: 200 synthetic comments for a fictional expenses app, loaded as a deliberately imperfect starting layout (six clusters, 50 notes unsorted). You can also import your own CSV.
3. Drag "which plan am I even on?" onto **New cluster**, then drag "the billing page makes no sense" onto it.
4. The agent names the cluster "Plan & billing confusion" and moves matching notes in from the other columns. In the run I recorded it moved 14 notes, and each one carries an "Agent:" chip with its reason, like "Charged twice, can't explain from invoice".
5. Click **Sort with agent**. It files the unsorted pile in batches of up to 25 notes.
6. Click **Report**. The agent writes the themes by size, with verbatim quotes and a suggested next step. You edit it and export Markdown.

You can also select a few notes and click **More like these** to teach the agent without creating a cluster first.

## What makes it different

- **One action layer, two callers.** When you drag a note, the UI calls `move-notes`. When the agent moves a note, it calls the same `move-notes` as a tool. Same validation, same permissions, same code.
- **The agent can't move a note without saying why.** The action rejects an agent move that has no one-line reason, and rejects an agent call with more than 25 moves. The batch limit doesn't depend on the model following instructions.
- **The agent sees what you see.** Your note selection is written to app-state, and the agent reads it through `view-screen`. The agent can also open the report pane for you with a `navigate` command.
- **Short turns on purpose.** Every agent turn is one small batch (teach: up to 20 moves, sort: up to 25 notes), so it finishes inside the hosted time limit.
- **Safe to leave on a public URL.** Sign-in is required, each account only sees its own board, each account gets 40 agent turns per day, and the model key stays on the server.

## How I used Agent-Native

Stigi is built on the Agent-Native framework, and the whole product leans on its core idea: the UI and the agent share the same actions, data and screen state.

- **Actions:** `import-notes`, `list-notes`, `create-cluster`, `rename-cluster`, `move-notes`, `merge-clusters`, `delete-cluster`, `get-board-digest`, `get-report`, `save-report` and `view-screen`, all defined once with `defineAction()`. The board calls them through the framework's hooks, and the agent calls them as tools. Reset board is UI-only and hidden from the agent.
- **Shared app-state:** `navigation` and `selection` are written by the UI. `navigate` is written by the agent. `view-screen` returns the selection plus a board summary.
- **UI to agent handoff:** when a cluster you made reaches two notes, the UI hands the request to the agent chat with the cluster id and seed notes as hidden context.
- **Agent instructions:** an `AGENTS.md` section plus three skills, `sort-feedback`, `teach-cluster` and `write-report`.
- **Live board:** the framework refetches the board's queries on every agent tool call, and I added 750 ms polling while the agent works, so notes glide into place on serverless hosting too.
- **No inline LLM calls anywhere.** Everything AI goes through the agent.

## Does it actually work

In the recorded run on the live app, the teach turn took 18 seconds and a 25-note sort batch took 22 seconds (48 unsorted notes down to 23).

What I measured and tested:

- **Money shot as a test.** Two real drags, a real agent turn, then assertions that the cluster got a name, at least 6 notes arrived carrying reasons, and the board updated without a page reload. It runs against the deployed app.
- **Turn budget.** Teach and sort turns must finish under 35 seconds. I also measured Vercel directly: a signed-in request that waits 45 or 58 seconds returns 200, and one that waits 62 seconds returns 504. The 60-second function limit holds.
- **Test suites.** 123 unit and component tests, plus the Playwright end-to-end suite. The final production run passed 9 of 9 on the first attempt.
- **Cost.** All the live testing and demo takes together used about $3.50 of OpenRouter credit on Claude Sonnet 5.5.

## A real bug: the message that never arrived

My first demo take failed. I dragged the second note, the board switched to "Agent working...", and nothing else happened. The agent sidebar had opened empty.

The cause: when the agent chat panel is closed, the framework holds a handoff request for only 8 seconds while the panel loads. If the panel loads slower than that, the request is silently dropped. My board had already flipped to "working" and nothing ever flipped it back. My automated test missed it because it ran with the panel open.

The fix was to send through the framework's confirmed-delivery call, wait up to 10 seconds for the chat to acknowledge, retry once by opening the panel, and show an error instead of hanging. I added a test that closes the panel first.

Two more that taught me something:

- **The agent crashed in production while the board worked.** The deployed agent-chat functions failed on startup with `ERR_MODULE_NOT_FOUND 'yjs'`. Nitro copies the server bundle for each agent-chat function before the framework patches that import, so the copies kept a broken one. A script now re-syncs them after every build, and every deploy gate includes a signed-in agent-chat smoke check.
- **My first production migration reported success but left the live database empty.** Sign-up returned a 500 on the live site because the auth tables didn't exist. The migration had evidently run against a local database instead of Neon. Re-running it with `CONTEXT=production` makes it refuse a local database, and it applied everything to Neon.

I also changed models mid-build. When my OpenRouter credit ran out I tried Gemini. The cheap Flash-Lite model filed 25, 25, 10, 10 and 49 notes per turn on the sort step, and the full Flash model returned 503s. I went back to Claude Sonnet 5.5.

## What it doesn't do

Corrections steer the current board only. Stigi doesn't learn across sessions. The demo uses synthetic data. A public instance needs a funded model key, so when that credit runs out the agent stops answering while the board keeps working.

## How I built it

- **Stack:** Agent-Native (`@agent-native/core` 0.226.0), React 19, React Router 8, Nitro 3, Drizzle ORM, Postgres (PGlite locally, Neon in production), `@dnd-kit/core` for drag-and-drop, `motion` for the glide, Vitest and Playwright.
- **Agent:** Claude Sonnet 5.5 through OpenRouter, using the framework's built-in OpenRouter engine.
- **Hosting:** Vercel, with Neon for the database and a custom domain.
- **Process:** I built it with Claude Code as an AI pair. I extracted the hackathon's rules and docs first, then scored 37 candidate ideas against the judging rubric, and Stigi came out on top. One session turned that into a spec, six plans and a 50-task manifest. Another dispatched a fresh subagent per task and ran each task's gate before committing. I shipped 48 of the 50 tasks and cut two polish tasks on the landing page.

## What I built on

- The Agent-Native `chat` template and its toolkit components (the app shell and agent sidebar).
- Design tokens and motion rules from the `design-taste-frontend` kit, used for the landing page.
- Open libraries: `@dnd-kit/core`, `motion`, Drizzle, Zod, Vitest, Playwright.
- Third-party assets: the fonts Host Grotesk and JetBrains Mono (SIL Open Font License), Tabler Icons (MIT), Lucide icons (ISC), and the photograph "Tabel day 1" by Jan Kahánek (CC0, Wikimedia Commons).

Everything Stigi-specific was built during the event, on 9 and 10 November: every action and its tests, the database schema, the board UI, the agent instructions and skills, the daily turn cap, the deployment setup, the landing page and the logo. The logo is original geometry plus Host Grotesk outlines.

## Links and credits

- Live app: https://stigi.suitz.xyz (sign up with any email and password)
- Demo: https://clips.agent-native.com/share/xcUFzqFhqqei (a recording of a real run of the live app, captured with Playwright, with synthetic narration, hosted on Clips)
- Slides: https://stigi-slides.vercel.app
- Code: https://github.com/Dotman-Bei/stigi
- Hackathon: https://www.builder.io/hackathon

Thanks to Builder.io for the Agent-Native framework and the hackathon, to Anthropic for Claude, and to OpenRouter, Vercel and Neon for the plumbing.
