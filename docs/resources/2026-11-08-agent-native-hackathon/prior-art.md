# Prior art — shipped Agent-Native apps and showcases

**Past winners / showcases: none exist.** This appears to be the first Agent-Native Hackathon. No winners
gallery or submitted-project list is published (event page, Rules, and a web search on 2026-11-08 turned up
none). Winners are targeted for 2026-11-13. So the "competitors" judges will mentally compare against are
**Builder's own first-party apps** below, which every judge knows well.

Tech for all of the below: `@agent-native/core` (TypeScript, React + React Router, Nitro, Drizzle on
Postgres/PGlite, Better Auth), MIT-licensed, in https://github.com/BuilderIO/agent-native.

## First-party apps (gallery https://www.agent-native.com/apps/, Chrome 2026-11-08; one-liners verbatim)

| App | Stage | One-line (verbatim) | Link | Source |
|---|---|---|---|---|
| Design | ALPHA | "Turns prompts into interactive designs that follow your design system and improve with agent feedback." | /apps/design/ | `templates/design` |
| Slides | ALPHA | "Generate on-brand presentations with your AI agent, then edit slides yourself and export anywhere." | /apps/slides/ | `templates/slides` |
| Clips | BETA | "Capture browser debug logs, get transcripts, and use built-in dictation. 100% free, open-source, and customizable." | /apps/clips/ | `templates/clips` |
| Analytics | ALPHA | "Connects your data so an agent can answer questions in plain language and turn results into charts and dashboards." | /apps/analytics/ | `templates/analytics` |
| Calendar | ALPHA | "Brings your Google Calendars together so an agent can find time, schedule or move events, and manage bookings." | /apps/calendar/ | `templates/calendar` |
| Mail | ALPHA | "A keyboard-first inbox where an agent prioritizes mail, drafts replies, summarizes threads, and follows up." | /apps/mail/ | `templates/mail` |
| Assets | ALPHA | "Gives agents shared brand guidelines, images and videos to create and choose on-brand media across apps." | /apps/assets/ | `templates/assets` |
| Content | ALPHA | "Lets an agent work in your documents to draft in your voice, create interactive content, and publish to your site." | /apps/content/ | `templates/content` |
| Dispatch | ALPHA | "Centralized messaging and management for every agent in your stack. Talk to your agents from Slack, Telegram, or the web; route jobs, hold memory, approve actions, and delegate across apps over A2A." | /apps/dispatch/ | `templates/dispatch` |
| Forms | ALPHA | "Agent-Native form builder. Generate forms from a prompt, edit fields visually or conversationally, and send submissions to Slack, Discord, Google Sheets, or webhooks." | /apps/forms/ | `templates/forms` |
| Plans | ALPHA | "Install visual planning as an app-backed skill. Your coding agent can open structured plans with diagrams, wireframes, prototypes, annotations, comments, and shareable review links." | /apps/plan/ | `templates/plan` |

## Repo templates not in the gallery (`templates/*/package.json` descriptions, verbatim; `gh api` 2026-11-08)

| Template | Description |
|---|---|
| chat | "Minimal chat-first agent-native app template." (the default scaffold, `--template chat`) |
| crm | "Native SQL CRM and HubSpot or Salesforce agent-native companion" |
| factory | "Build agent factories: work in one end, shipped changes out the other, with gates you control." |
| tasks | "Task-list-first agent-native app with inbox, custom fields, and drag-and-drop ordering" |
| brain | (no package description; the README has a "Brain at a glance" source-to-answer architecture overview) |
| videos, community | (no package description) |

## Community templates (`community-templates/*/package.json`, verbatim; a GTM/sales-heavy cluster)

| Template | Description |
|---|---|
| account-expert | "Keep a current account brief for every conversation." |
| account-tiering | "Prioritize accounts using product, renewal, and relationship signals." |
| call-follow-up-drafter | "Turn call notes into reviewable follow-up drafts." |
| churn-early-warning | "Spot account risk before renewal." |
| demo-clip-library | "Find customer clips worth reusing in the next conversation." |
| linkedin-icp-prospect-tracker | "Rank prospects by fit and timing." |
| linkedin-signal-watch | "Track meaningful people and company changes." |
| outbound-in-your-voice | "Draft thoughtful outreach from real account signals." |
| win-loss-memo | "Compare the reasons behind deal outcomes." |

## Observed white space (facts for idea-forge's novelty step, not a recommendation)

Already covered first-party: design, slides, screen recording, analytics/BI, calendar, email, brand assets,
docs/content, agent ops (Dispatch), forms, planning, CRM, tasks. The community set clusters on B2B sales/GTM.
An entry that recreates one of these will be judged head-to-head against Builder's own version.

## Unfollowed leads

- AI Tinkerers chapter handbooks (e.g. copenhagen.aitinkerers.org/hackathons/h_PUbtKQHWTpg/handbook) came up in
  the search; JS was blocked on that domain and it's outside the event ecosystem, so its relation to this event
  is **unverified**.
- A separate "Agent Natives Builders Hackathon" (luma.com, Frontier Tower SF) is a **different event**.
