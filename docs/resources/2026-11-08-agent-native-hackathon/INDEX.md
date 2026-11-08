# Resource pack — Agent-Native Hackathon (Builder.io), extracted 2026-11-08

Produced by Step 0a (resource-extractor), session S0a, model `claude-opus-5-5`. **idea-forge should read
this pack as its primary source.** Campaign tollgate: `docs/tollgate/2026-11-08-tollgate.md`.

**Deadline: Mon 2026-11-09 23:59 PT = 2026-11-10 07:59 UTC = Tue 2026-11-10 08:59 WAT.**

## Contents

| File | What's in it |
|---|---|
| [event.md](event.md) | Deadline, eligibility (no team cap stated), entry steps, **submit-form fields**, public-repo rule (not required), **rubric 40/20/20/20 verbatim**, prizes ($10k across 5 ranks), disqualifiers |
| [tracks.md](tracks.md) | **No tracks or bounties.** The 4 non-cash recognition categories, verbatim |
| [sponsors/agent-native.md](sponsors/agent-native.md) | Scaffold command, project structure, `defineAction()` signature, UI↔agent hooks and app-state API, data layer, LLM keys, env vars, deploy targets, gotchas |
| [sponsors/clips.md](sponsors/clips.md) | Required recorder: public-link rules, account wall, record paths, length (unspecified), share and embed URLs |
| [prior-art.md](prior-art.md) | 11 gallery apps + 7 extra templates + 9 community templates; no past winners exist |

## Provenance

| # | Source URL | Fetched | Tool | Primary / secondary | Confidence / gaps |
|---|---|---|---|---|---|
| 1 | https://www.builder.io/hackathon/rules | 2026-11-08 | Chrome `get_page_text` | **Primary (controlling)** | High: full article text captured. Tie-break sentence renders starting lowercase ("compare the tied…"), so a leading clause may be missing on the page; quoted as shown |
| 2 | https://www.builder.io/hackathon/submit | 2026-11-08 | Chrome `read_page` + read-only DOM query (no input, **not submitted**) | Primary | High: labels, `name`s, and required flags read from the DOM |
| 3 | https://www.builder.io/hackathon | 2026-11-08 | Chrome `read_page`, accordion clicks, DOM text, screenshot | Primary | High for rubric, categories, prizes, FAQ (29 Qs listed; ~16 answers captured). The starter command and code snippet came from a **screenshot** (script output was filter-blocked). Some long FAQ answers were captured in pieces |
| 4 | https://github.com/BuilderIO/agent-native (README, tree, package.json files) | 2026-11-08 | `gh api` | Primary | High. Release v0.1.293 (2026-11-06); `main` pushed 2026-11-08, so content may change after fetch |
| 5 | agent-native docs source `packages/core/docs/content/{getting-started,key-concepts,what-is-agent-native,actions-overview,actions-defining,actions-run-context,client-data,client-overview,server-database,context-awareness,environment-variables,deployment,deploy-an-app,agent-surfaces}.mdx` (= https://www.agent-native.com/docs/<slug>) | 2026-11-08 | `gh api` raw from `main` | Primary (same source as the rendered docs site) | High for what was read. Read in full: getting-started, actions-defining, env-vars (LLM section), deploy-an-app. Grepped or skimmed: client-data, context-awareness, key-concepts, deployment. Downloaded but not read: actions-run-context, server-database, agent-surfaces, client-overview, what-is-agent-native |
| 6 | Clips docs `template-clips{,-features,-developers}.mdx`, `recorder.mdx` | 2026-11-08 | `gh api` | Primary | Medium-high: grepped for sharing, limits, and auth. **No length limit documented** |
| 7 | https://clips.agent-native.com/ | 2026-11-08 | Chrome screenshot | Primary | High that a sign-in wall exists. **Did not log in**, so account state is unknown |
| 8 | https://www.agent-native.com/apps/clips/ | 2026-11-08 | Chrome DOM headings + FAQ text | Primary | High for the 3 FAQ answers captured |
| 9 | https://www.agent-native.com/apps/ | 2026-11-08 | Chrome DOM (card links + text) | Primary | High: 11 cards |
| 10 | https://www.agent-native.com/docs/ (rendered) | 2026-11-08 | Chrome navigate only | Primary | Not text-extracted; the repo source (#5) was used instead |
| 11 | WebSearch "Agent-Native Builder.io hackathon showcase…" | 2026-11-08 | WebSearch (standard) | Secondary | Found no showcases. Its summary claimed a start of "October 19, 2026", which appears on **no primary page** (Rules say Oct 27); treated as an unreliable summary and disregarded |
| 12 | copenhagen.aitinkerers.org/…/h_PUbtKQHWTpg/handbook | 2026-11-08 | Chrome (JS denied) | Secondary | **Unverified**, off-ecosystem lead; not used |

## Cross-checks done

- **Deadline:** Rules, event-page timeline, submit page, and FAQ all give Nov 9, 11:59 PM PT ✔. The Rules supply the UTC conversion ✔.
- **Rubric weights:** Rules, event-page sidebar, and FAQ all say 40/20/20/20 ✔. The event page's short descriptions differ in wording from the Rules (both quoted in event.md; the Rules control).
- **Prizes:** Rules and event page both say $5,000 / $2,500 / $1,500 / $750 / $250 = $10,000 ✔.
- **Scaffold command:** the event page shows `npx --yes @agent-native/core@latest create my-app`; the README and docs show `… create my-app --standalone --template chat` (the documented path).
- **Node version:** the docs require **≥22.22**; this machine has 22.17.1, so tollgate row C1 FAILs (Step 2 blocked until upgraded).

## Open gaps (labeled, not filled)

1. Team-size cap: none stated anywhere (treat as no cap; Rules + FAQ only require every member to be eligible and named).
2. Clips recording length: not specified.
3. Clips account status for this user: not checked. Whether a self-hosted Clips link is accepted: not stated.
4. How the recognition categories are selected: no procedure published.
5. "Approved mentorship and credits" (FAQ): not defined.
6. Rules tie-break sentence possibly truncated on the page.
