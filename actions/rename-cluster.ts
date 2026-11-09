import { defineAction } from "@agent-native/core/action";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { getOwnedCluster } from "../server/lib/board-store.js";
import { requireOwner } from "../server/lib/owner.js";
import { MAX_CLUSTER_NAME_CHARS } from "../shared/board-types.js";

export default defineAction({
  description: "Rename a cluster. Use a 2–4 word theme name that describes what its notes share.",
  schema: z.object({
    clusterId: z.string().min(1).describe("The cluster to rename."),
    name: z.string().trim().min(1).max(MAX_CLUSTER_NAME_CHARS).describe("New theme name, 2–4 words."),
  }),
  run: async ({ clusterId, name }, ctx) => {
    const owner = requireOwner(ctx);
    await getOwnedCluster(owner, clusterId);
    await getDb().update(schema.stigiClusters)
      .set({ name, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.stigiClusters.ownerEmail, owner), eq(schema.stigiClusters.id, clusterId)));
    return { id: clusterId, name, message: `Renamed the cluster to "${name}".` };
  },
});
