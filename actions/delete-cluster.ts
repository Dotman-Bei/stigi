import { defineAction } from "@agent-native/core/action";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { getOwnedCluster, nextNotePosition } from "../server/lib/board-store.js";
import { actorFromCtx } from "../server/lib/caller.js";
import { requireOwner } from "../server/lib/owner.js";

export default defineAction({
  description: "Delete a cluster; its notes go back to Unsorted (no note is ever deleted).",
  schema: z.object({ clusterId: z.string().min(1).describe("The cluster to delete.") }),
  run: async ({ clusterId }, ctx) => {
    const owner = requireOwner(ctx);
    const actor = actorFromCtx(ctx);
    await getOwnedCluster(owner, clusterId);
    const db = getDb();
    const notes = schema.stigiNotes;
    const moving = await db.select({ id: notes.id }).from(notes)
      .where(and(eq(notes.ownerEmail, owner), eq(notes.clusterId, clusterId)))
      .orderBy(asc(notes.position));
    const now = new Date().toISOString();
    let position = await nextNotePosition(owner, null);
    for (const row of moving) {
      await db.update(notes)
        .set({ clusterId: null, reason: null, movedBy: actor, movedAt: now, position })
        .where(and(eq(notes.ownerEmail, owner), eq(notes.id, row.id)));
      position += 1;
    }
    await db.delete(schema.stigiClusters)
      .where(and(eq(schema.stigiClusters.ownerEmail, owner), eq(schema.stigiClusters.id, clusterId)));
    return { id: clusterId, unsorted: moving.length, message: `Deleted the cluster; ${moving.length} notes went back to Unsorted.` };
  },
});
