import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { clipText, loadBoard } from "../server/lib/board-store.js";
import { requireOwner } from "../server/lib/owner.js";
import { UNTITLED_LABEL } from "../shared/board-types.js";

export default defineAction({
  description:
    "Deterministic digest for the insight report: themes by size with share and up to 3 verbatim quotes each, plus unsorted and sample counts.",
  schema: z.object({}),
  http: { method: "GET" },
  readOnly: true,
  run: async (_args, ctx) => {
    const board = await loadBoard(requireOwner(ctx));
    const total = board.totalNotes;
    const themes = board.clusters
      .filter((c) => c.notes.length > 0)
      .map((c) => ({
        clusterId: c.id,
        name: c.name ?? UNTITLED_LABEL,
        noteCount: c.notes.length,
        share: total > 0 ? Math.round((c.notes.length * 100) / total) : 0,
        quotes: c.notes.slice(0, 3).map((n) => clipText(n.body, 200)),
      }))
      .sort((a, b) => b.noteCount - a.noteCount || a.name.localeCompare(b.name));
    return {
      id: "digest",
      totalNotes: total,
      unsortedCount: board.unsorted.length,
      sampleNotes: board.sampleNotes,
      themes,
      message: `${themes.length} themes across ${total} notes.`,
    };
  },
});
