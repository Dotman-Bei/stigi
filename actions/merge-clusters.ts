import { defineAction, fail } from "@agent-native/core/action";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { getOwnedCluster, nextNotePosition } from "../server/lib/board-store.js";
import { actorFromCtx } from "../server/lib/caller.js";
import { requireOwner } from "../server/lib/owner.js";
import { UNTITLED_LABEL } from "../shared/board-types.js";

export default defineAction({
  description: "Merge one cluster into another: every note moves to the target and the source cluster is removed.",
  schema: z.object({
    sourceClusterId: z.string().min(1).describe("Cluster to merge away."),
    targetClusterId: z.string().min(1).describe("Cluster that receives the notes."),
  }),
  run: async ({ sourceClusterId, targetClusterId }, ctx) => {
    const owner = requireOwner(ctx);
    const actor = actorFromCtx(ctx);
    if (sourceClusterId === targetClusterId) {
      fail("Pick two different clusters to merge.", { errorCode: "invalid_input", statusCode: 400 });
    }
    await getOwnedCluster(owner, sourceClusterId);
    const target = await getOwnedCluster(owner, targetClusterId);
    const targetName = target.name ?? UNTITLED_LABEL;
    const db = getDb();
    const notes = schema.stigiNotes;
    const moving = await db.select({ id: notes.id }).from(notes)
      .where(and(eq(notes.ownerEmail, owner), eq(notes.clusterId, sourceClusterId)))
      .orderBy(asc(notes.position));
    const now = new Date().toISOString();
    let position = await nextNotePosition(owner, targetClusterId);
    for (const row of moving) {
      await db.update(notes)
        .set({
          clusterId: targetClusterId,
          reason: actor === "agent" ? `Merged into "${targetName}"` : null,
          movedBy: actor,
          movedAt: now,
          position,
        })
        .where(and(eq(notes.ownerEmail, owner), eq(notes.id, row.id)));
      position += 1;
    }
    await db.delete(schema.stigiClusters)
      .where(and(eq(schema.stigiClusters.ownerEmail, owner), eq(schema.stigiClusters.id, sourceClusterId)));
    return { id: targetClusterId, moved: moving.length, message: `Merged ${moving.length} notes into "${targetName}".` };
  },
});
