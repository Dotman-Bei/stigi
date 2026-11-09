# frontend-kit — support files for docs/design/frontend.md

`docs/design/frontend.md` is the design-taste-frontend skill text; its `<skill>` placeholder means THIS
directory (`docs/design/frontend-kit/`). This is a FULL copy of the user's local skill
(`C:\Users\bamig\Documents\VIBE CODE\Hackathons\.claude\skills\design-taste-frontend\`), complete as of
2026-11-09: `references/`, `library/`, `scripts/`, and all of `assets/` (starter.html, system.css/js, layout,
photos, objects, icons, scenes, moments, effects, components, ui, motion, backgrounds, diagrams).

History: the first commit (4f18b8c) shipped an app-relevant subset because Stigi was planned as an app UI
only. On 2026-11-09 the user asked for a marketing landing page as well, so the omitted marketing parts
(photos, objects, layout, icons, scenes, moments) were restored.

Two surfaces, one design system (same palette/type/radius, deal recorded in the spec §10):
- the BOARD APP (`/board`): tokens, type, radius, motion and UI/component recipes only;
- the LANDING PAGE (`/`): the full skill workflow (hero deal, sections, product-UI fragments, photos per
  `references/photos.md`, one moment per `references/moments.md`, and the skill's checkers).

Provenance duty: library photographs come from Wikimedia Commons / Unsplash (`assets/photos/photos.json`
holds each frame's credit). Any frame actually used on the page must be credited, and listed under
third-party assets in docs/gates/submission-draft.md (the Rules require identifying them).
Never edit the original skill folder; copy what you need.
