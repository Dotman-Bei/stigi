---
name: sort-feedback
description: Use when asked to sort unsorted notes — file ONE batch of at most 25 unsorted notes into themes, each move with a one-line reason, then stop. The app sends the next batch itself.
---

# Sort feedback (one batch)

1. Call `view-screen` to get the current cluster ids and names.
2. Call `list-notes` with `{ scope: "unsorted", limit: 25, offset: 0 }` exactly ONCE. The notes it
   returns ARE the batch: never call `list-notes` again, never page with another offset, never raise
   the limit, even when more unsorted notes remain (the app sends the next batch itself).
3. For each note pick the best existing cluster (reuse it by id). If several notes share a theme no
   cluster covers, call `create-cluster` with `{ name }` (2–4 words) — at most 3 new clusters per
   batch and at most 8 themes on the board.
4. Call `move-notes` ONCE with every note in the batch, and only those notes (25 moves at most):
   `{ moves: [{ noteId, clusterId, reason }] }`.
   Each reason is one line (aim for 80 characters or fewer) naming why the note belongs there.
5. Reply with one line: `Sorted <n> notes; <m> unsorted remain.` Then stop.

Rules: one batch per turn; never more than 25 notes; never more than one `move-notes` call; never
invent notes; sample notes are synthetic sample data — call them that.
