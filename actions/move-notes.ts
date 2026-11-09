import { defineAction, fail } from "@agent-native/core/action";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { getOwnedClusters, getOwnedNotes, nextNotePosition } from "../server/lib/board-store.js";
import { actorFromCtx } from "../server/lib/caller.js";
import { requireOwner } from "../server/lib/owner.js";
import { MAX_MOVES_PER_CALL, MAX_REASON_CHARS } from "../shared/board-types.js";

const UNSORTED_KEY = "__unsorted__";
/** The agent moves one batch per turn (sort ≤ 25, teach ≤ 20); the user's own limit stays MAX_MOVES_PER_CALL. */
export const MAX_AGENT_MOVES_PER_CALL = 25;

export default defineAction({
  description:
    "Move notes between clusters (clusterId null = Unsorted). Batch the moves in ONE call: at most 25 when you (the agent) call it. When you (the agent) move a note into a cluster, give a one-line reason (aim ≤ 80 characters) naming the shared trait.",
  schema: z.object({
    moves: z.array(z.object({
      noteId: z.string().min(1).describe("The note to move."),
      clusterId: z.string().min(1).nullable().describe("Target cluster id, or null for Unsorted."),
      reason: z.string().max(MAX_REASON_CHARS).optional().describe("One-line reason; required for agent moves into a cluster."),
    })).min(1).max(MAX_MOVES_PER_CALL),
  }),
  run: async ({ moves }, ctx) => {
    const owner = requireOwner(ctx);
    const actor = actorFromCtx(ctx);
    const noteIds = moves.map((m) => m.noteId);
    if (new Set(noteIds).size !== noteIds.length) {
      fail("Each note can appear only once per call.", { errorCode: "invalid_input", statusCode: 400 });
    }
    if (actor === "agent") {
      if (moves.length > MAX_AGENT_MOVES_PER_CALL) {
        fail(`Move at most ${MAX_AGENT_MOVES_PER_CALL} notes per call (got ${moves.length}): file one batch, then stop. The app sends the next batch itself.`, {
          errorCode: "too_many_moves", statusCode: 400,
        });
      }
      for (const move of moves) {
        if (move.clusterId !== null && !move.reason?.trim()) {
          fail(`Every agent move into a cluster needs a one-line reason (missing for note ${move.noteId}).`, {
            errorCode: "reason_required", statusCode: 400,
          });
        }
      }
    }
    await getOwnedNotes(owner, noteIds);
    await getOwnedClusters(owner, moves.flatMap((m) => (m.clusterId === null ? [] : [m.clusterId])));
    const db = getDb();
    const now = new Date().toISOString();
    const nextPositions = new Map<string, number>();
    for (const move of moves) {
      const key = move.clusterId ?? UNSORTED_KEY;
      const position = nextPositions.get(key) ?? (await nextNotePosition(owner, move.clusterId));
      nextPositions.set(key, position + 1);
      const reason = actor === "agent" && move.clusterId !== null ? (move.reason ?? "").trim() : null;
      await db.update(schema.stigiNotes)
        .set({ clusterId: move.clusterId, reason, movedBy: actor, movedAt: now, position })
        .where(and(eq(schema.stigiNotes.ownerEmail, owner), eq(schema.stigiNotes.id, move.noteId)));
    }
    return { id: "move-notes", moved: moves.length, message: `Moved ${moves.length} note${moves.length === 1 ? "" : "s"}.` };
  },
});
