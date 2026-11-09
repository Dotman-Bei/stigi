---
name: teach-cluster
description: Use when the user drags notes into a new cluster or asks for "more like these" — name the cluster from its seed notes and move every clearly matching note into it, each with a one-line reason, in one short turn.
---

# Teach cluster

The user taught you a theme by putting seed notes together. Generalize it in ONE short turn.

1. Read the request context: `clusterId=<id>` and the seed notes. If the context is missing, call
   `view-screen` and use `selectedCluster` (or the cluster the user names).
2. Decide the seeds' shared theme in 2–4 words (for example "Plan & billing confusion") and call
   `rename-cluster` with `{ clusterId, name }` FIRST and ALONE: make it the only tool call in that step
   and wait for its result before calling any other tool, so the user sees the cluster get its name
   before matching notes glide in.
3. Call `list-notes` once with `{ scope: "outside-cluster", clusterId, limit: 250, offset: 0 }`.
4. Pick the notes that clearly share the seeds' theme, wherever they are now. Precision over recall:
   skip anything ambiguous. At most 20.
5. Call `move-notes` ONCE with all picks: `{ moves: [{ noteId, clusterId, reason }] }`. Each reason is
   one line (aim for 80 characters or fewer) naming the shared trait, e.g. "Unsure which plan they're on".
6. Reply with one line: `Named "<name>" and moved <n> notes.` Then stop.

Rules: never invent notes; never move a seed out of the cluster; never call `move-notes` more than
once; never rename other clusters; sample notes are synthetic sample data — call them that.
