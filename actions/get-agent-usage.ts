import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { readAgentUsage } from "../server/lib/agent-usage.js";
import { requireOwner } from "../server/lib/owner.js";

export default defineAction({
  description: "Today's agent-turn usage for the signed-in user (UI only).",
  schema: z.object({}),
  http: { method: "GET" },
  readOnly: true,
  agentTool: false,
  run: async (_args, ctx) => {
    const usage = await readAgentUsage(requireOwner(ctx));
    return { id: "agent-usage", ...usage, message: `${usage.remaining} of ${usage.limit} agent turns left today.` };
  },
});
