import { defineAction } from "@agent-native/core/action";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { requireOwner } from "../server/lib/owner.js";

export default defineAction({
  description: "Clear the signed-in user's board (notes, clusters, report). UI only; the agent cannot call it.",
  schema: z.object({}),
  agentTool: false,
  run: async (_args, ctx) => {
    const owner = requireOwner(ctx);
    const db = getDb();
    await db.delete(schema.stigiNotes).where(eq(schema.stigiNotes.ownerEmail, owner));
    await db.delete(schema.stigiClusters).where(eq(schema.stigiClusters.ownerEmail, owner));
    await db.delete(schema.stigiReports).where(eq(schema.stigiReports.ownerEmail, owner));
    return { id: "board", message: "Board reset." };
  },
});
