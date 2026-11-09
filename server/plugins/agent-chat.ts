import { getOrgContext } from "@agent-native/core/org";
import {
  createAgentChatPlugin,
  loadActionsFromStaticRegistry,
} from "@agent-native/core/server";

import actionsRegistry from "../../.generated/actions-registry.js";
import { guardAgentTurn } from "../lib/agent-usage.js";
import {
  searchConversationReferences,
  validateConversationReferences,
} from "../lib/composer-references.js";

// Report actions (get-board-digest, save-report, get-report) and merge-clusters are added in later tasks.
const INITIAL_TOOL_NAMES = [
  "view-screen",
  "navigate",
  "list-notes",
  "create-cluster",
  "rename-cluster",
  "move-notes",
  "ask-question",
];

export const STIGI_SYSTEM_PROMPT = `You are Stigi's sorting agent: you organize customer feedback notes on the user's board into themes using the board actions, and every move you make carries a one-line reason.

Stigi is an Agent-Native app: the board UI and you share the same actions and data, so your moves appear on the user's board live. Follow AGENTS.md and the teach-cluster, sort-feedback and write-report skills. Keep every turn to one small batch of tool calls and a one-line reply. Sample notes are synthetic sample data; say so when you mention them.`;

export default createAgentChatPlugin({
  appId: "chat",
  mentionProviders: {
    chats: {
      label: "composerSources.group",
      search: searchConversationReferences,
    },
  },
  prepareRequest: async ({ references, ownerEmail, internalContinuation }) => {
    await validateConversationReferences(references);
    await guardAgentTurn({ ownerEmail, internalContinuation: internalContinuation === true });
  },
  actions: loadActionsFromStaticRegistry(actionsRegistry),
  mcp: { connectorCatalog: [], appApprovalPage: true },
  initialToolNames: INITIAL_TOOL_NAMES,
  resolveOrgId: async (event) => (await getOrgContext(event)).orgId,
  systemPrompt: STIGI_SYSTEM_PROMPT,
});
