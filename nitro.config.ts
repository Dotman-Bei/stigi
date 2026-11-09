import { defineConfig } from "nitro";

// Agent turns run in 40 s chunks (framework soft timeout); 60 s functions leave headroom.
// The deployed duration probe (Task 12) confirms what the Vercel plan really allows.
export default defineConfig({
  vercel: {
    functions: { maxDuration: 60 },
    functionRules: {
      "/_agent-native/agent-chat": { maxDuration: 60 },
      "/_agent-native/agent-chat/**": { maxDuration: 60 },
      "/_agent-native/agent-chat-stream": { maxDuration: 60 },
    },
  },
});
