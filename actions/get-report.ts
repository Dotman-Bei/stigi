import { defineAction } from "@agent-native/core/action";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { requireOwner } from "../server/lib/owner.js";

export default defineAction({
  description: "Read the current insight report (Markdown) and who last wrote it.",
  schema: z.object({}),
  http: { method: "GET" },
  readOnly: true,
  run: async (_args, ctx) => {
    const owner = requireOwner(ctx);
    const [row] = await getDb().select().from(schema.stigiReports).where(eq(schema.stigiReports.ownerEmail, owner));
    return {
      id: "report",
      markdown: row?.markdown ?? "",
      updatedBy: row?.updatedBy ?? null,
      updatedAt: row?.updatedAt ?? null,
      message: row ? "Report loaded." : "No report yet.",
    };
  },
});
