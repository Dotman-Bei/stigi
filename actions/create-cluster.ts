import { defineAction, fail } from "@agent-native/core/action";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { frontClusterPosition, getOwnedNotes } from "../server/lib/board-store.js";
import { actorFromCtx } from "../server/lib/caller.js";
import { requireOwner } from "../server/lib/owner.js";
import { MAX_CLUSTER_NAME_CHARS, MAX_MOVES_PER_CALL } from "../shared/board-types.js";

export default defineAction({
  description:
    "Create a cluster (theme) on the board, optionally named. The agent creates EMPTY named clusters and then fills them with move-notes so every move has a reason; the UI passes noteIds when the user drags notes onto 'New cluster'.",
  schema: z.object({
    name: z.string().trim().min(1).max(MAX_CLUSTER_NAME_CHARS).optional().describe("2–4 word theme name; omit for an untitled cluster."),
    noteIds: z.array(z.string().min(1)).max(MAX_MOVES_PER_CALL).optional().describe("UI only: notes the user dropped into the new cluster."),
  }),
  run: async (args, ctx) => {
    const owner = requireOwner(ctx);
    const actor = actorFromCtx(ctx);
    const noteIds = args.noteIds ?? [];
    if (actor === "agent" && noteIds.length > 0) {
      fail("Create the cluster empty, then use move-notes so each move carries a reason.", {
        errorCode: "agent_move_requires_reason", statusCode: 400,
      });
    }
    await getOwnedNotes(owner, noteIds);
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const name = args.name ?? null;
    await db.insert(schema.stigiClusters).values({
      id, ownerEmail: owner, name, createdBy: actor,
      position: await frontClusterPosition(owner), createdAt: now, updatedAt: now,
    });
    let position = 0;
    for (const noteId of noteIds) {
      await db.update(schema.stigiNotes)
        .set({ clusterId: id, reason: null, movedBy: "user", movedAt: now, position })
        .where(and(eq(schema.stigiNotes.ownerEmail, owner), eq(schema.stigiNotes.id, noteId)));
      position += 1;
    }
    return { id, name, message: name ? `Created cluster "${name}".` : "Created an untitled cluster." };
  },
});
