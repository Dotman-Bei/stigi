import { defineAction, fail } from "@agent-native/core/action";
import { and, asc, count, eq, isNull, ne, or, type SQL } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { clipText, getOwnedCluster } from "../server/lib/board-store.js";
import { requireOwner } from "../server/lib/owner.js";
import { UNTITLED_LABEL } from "../shared/board-types.js";

export default defineAction({
  description:
    "List notes compactly (id, text ≤ 200 chars, current cluster name). scope 'unsorted' for sorting batches, 'outside-cluster' (with clusterId) to find notes that belong in a cluster you are teaching, 'all' for everything.",
  schema: z.object({
    scope: z.enum(["unsorted", "all", "outside-cluster"]).describe("Which notes to list."),
    clusterId: z.string().min(1).optional().describe("Required for scope 'outside-cluster'."),
    limit: z.coerce.number().int().min(1).max(250).default(60).describe("Page size (1–250)."),
    offset: z.coerce.number().int().min(0).default(0).describe("Page start."),
  }),
  http: { method: "GET" },
  readOnly: true,
  run: async (args, ctx) => {
    const owner = requireOwner(ctx);
    const notes = schema.stigiNotes;
    let where: SQL | undefined;
    if (args.scope === "unsorted") {
      where = and(eq(notes.ownerEmail, owner), isNull(notes.clusterId));
    } else if (args.scope === "outside-cluster") {
      const clusterId = args.clusterId;
      if (!clusterId) fail("Scope 'outside-cluster' needs clusterId.", { errorCode: "invalid_input", statusCode: 400 });
      await getOwnedCluster(owner, clusterId);
      where = and(eq(notes.ownerEmail, owner), or(isNull(notes.clusterId), ne(notes.clusterId, clusterId)));
    } else {
      where = eq(notes.ownerEmail, owner);
    }
    const db = getDb();
    const [totalRow] = await db.select({ value: count() }).from(notes).where(where);
    const total = totalRow?.value ?? 0;
    const rows = await db.select().from(notes).where(where)
      .orderBy(asc(notes.position), asc(notes.createdAt)).limit(args.limit).offset(args.offset);
    const clusterRows = await db.select({ id: schema.stigiClusters.id, name: schema.stigiClusters.name })
      .from(schema.stigiClusters).where(eq(schema.stigiClusters.ownerEmail, owner));
    const names = new Map<string, string>(clusterRows.map((c) => [c.id, c.name ?? UNTITLED_LABEL]));
    const end = args.offset + rows.length;
    return {
      total,
      notes: rows.map((r) => ({
        id: r.id,
        text: clipText(r.body, 200),
        cluster: r.clusterId === null ? null : (names.get(r.clusterId) ?? UNTITLED_LABEL),
      })),
      nextOffset: end < total ? end : null,
      message: `${rows.length} of ${total} notes.`,
    };
  },
});
