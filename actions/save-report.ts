import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { actorFromCtx } from "../server/lib/caller.js";
import { requireOwner } from "../server/lib/owner.js";

export default defineAction({
  description: "Save the insight report Markdown (replaces the previous version). Both the agent and the user's editor call this.",
  schema: z.object({ markdown: z.string().max(50_000).describe("The full report in Markdown.") }),
  run: async ({ markdown }, ctx) => {
    const owner = requireOwner(ctx);
    const updatedBy = actorFromCtx(ctx);
    const updatedAt = new Date().toISOString();
    await getDb().insert(schema.stigiReports)
      .values({ ownerEmail: owner, markdown, updatedBy, updatedAt })
      .onConflictDoUpdate({ target: schema.stigiReports.ownerEmail, set: { markdown, updatedBy, updatedAt } });
    return { id: "report", message: "Report saved." };
  },
});
