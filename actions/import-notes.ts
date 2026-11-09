import { defineAction, fail } from "@agent-native/core/action";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { countNotes, nextClusterPosition, nextNotePosition } from "../server/lib/board-store.js";
import { parseFeedbackCsv } from "../server/lib/csv.js";
import { requireOwner } from "../server/lib/owner.js";
import { MAX_BOARD_NOTES } from "../shared/board-types.js";
import { SAMPLE_FEEDBACK, SAMPLE_START_CLUSTERS } from "../shared/sample-feedback.js";

export default defineAction({
  description:
    "Import customer comments onto the board: the bundled 200-note SAMPLE DATA (synthetic, loaded as a pre-sorted starting layout) or CSV text into Unsorted. UI-only.",
  schema: z.object({
    csv: z.string().max(2_000_000).optional().describe("CSV text; the comment column is detected by header name, else column 1."),
    sample: z.boolean().optional().describe("true loads the bundled sample data."),
  }),
  agentTool: false,
  run: async (args, ctx) => {
    const owner = requireOwner(ctx);
    const counts = await countNotes(owner);
    const db = getDb();
    const now = new Date().toISOString();

    if (args.sample === true) {
      if (counts.sample > 0) {
        fail("Sample data is already on your board.", { errorCode: "sample_already_loaded", statusCode: 409 });
      }
      if (counts.total + SAMPLE_FEEDBACK.length > MAX_BOARD_NOTES) {
        fail(`A board holds at most ${MAX_BOARD_NOTES} notes.`, { errorCode: "too_many_notes", statusCode: 400 });
      }
      const firstPosition = await nextClusterPosition(owner);
      const clusterIds = new Map<string, string>();
      let offset = 0;
      for (const name of SAMPLE_START_CLUSTERS) {
        const id = crypto.randomUUID();
        clusterIds.set(name, id);
        await db.insert(schema.stigiClusters).values({
          id, ownerEmail: owner, name, createdBy: "sample",
          position: firstPosition + offset, createdAt: now, updatedAt: now,
        });
        offset += 1;
      }
      let unsortedPosition = await nextNotePosition(owner, null);
      const clusterPositions = new Map<string, number>();
      const rows = SAMPLE_FEEDBACK.map((item) => {
        const clusterId = item.start === null ? null : (clusterIds.get(item.start) ?? null);
        let position: number;
        if (clusterId === null) {
          position = unsortedPosition;
          unsortedPosition += 1;
        } else {
          position = clusterPositions.get(clusterId) ?? 0;
          clusterPositions.set(clusterId, position + 1);
        }
        return {
          id: crypto.randomUUID(), ownerEmail: owner, body: item.body, source: "sample" as const,
          clusterId, reason: null, movedBy: null, movedAt: null, position, createdAt: now,
        };
      });
      await db.insert(schema.stigiNotes).values(rows);
      return {
        id: "board",
        imported: rows.length,
        clustersCreated: SAMPLE_START_CLUSTERS.length,
        message: `Loaded ${rows.length} sample notes (pre-sorted starting layout).`,
      };
    }

    if (typeof args.csv === "string") {
      const bodies = parseFeedbackCsv(args.csv);
      if (bodies.length === 0) {
        fail("No comments found in that CSV.", { errorCode: "no_comments", statusCode: 400 });
      }
      if (counts.total + bodies.length > MAX_BOARD_NOTES) {
        fail(`A board holds at most ${MAX_BOARD_NOTES} notes; this import would make ${counts.total + bodies.length}.`, {
          errorCode: "too_many_notes", statusCode: 400,
        });
      }
      const start = await nextNotePosition(owner, null);
      const rows = bodies.map((body, index) => ({
        id: crypto.randomUUID(), ownerEmail: owner, body, source: "import" as const,
        clusterId: null, reason: null, movedBy: null, movedAt: null, position: start + index, createdAt: now,
      }));
      await db.insert(schema.stigiNotes).values(rows);
      return { id: "board", imported: rows.length, clustersCreated: 0, message: `Imported ${rows.length} notes into Unsorted.` };
    }

    return fail("Pass either csv or sample: true.", { errorCode: "invalid_input", statusCode: 400 });
  },
});
