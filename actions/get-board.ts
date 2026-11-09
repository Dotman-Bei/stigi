import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { loadBoard } from "../server/lib/board-store.js";
import { requireOwner } from "../server/lib/owner.js";

export default defineAction({
  description: "Read the whole board (clusters with notes, plus Unsorted) for the UI. The agent uses view-screen and list-notes instead.",
  schema: z.object({}),
  http: { method: "GET" },
  readOnly: true,
  agentTool: false,
  run: async (_args, ctx) => loadBoard(requireOwner(ctx)),
});
