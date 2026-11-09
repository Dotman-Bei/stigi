import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./app"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  test: {
    env: { DATABASE_URL: "pglite:memory" },
    // Each file's first beforeEach cold-starts PGlite and runs the migrations; with every file in
    // parallel on this machine that took >10 s (vitest's default hook timeout) and flaked the suite.
    hookTimeout: 30_000,
    exclude: [
      "**/node_modules/**",
      "**/.git/**",
      "**/dist/**",
      "**/.react-router/**",
      "**/e2e/**",
    ],
  },
});
