import { createToolkitAuthPlugin } from "@agent-native/toolkit/app/auth/server";

export default createToolkitAuthPlugin({
  workspaceAppPublicPaths: ["/"],
  // "/" is the public landing page (spec §18) instead of the sign-in page. Only "/" (exact) and the
  // landing's static files under /landing are public; /board and every other page keep the sign-in wall.
  rootAuth: false,
  publicPaths: ["/", "/landing"],
  marketing: false,
});
