import { existsSync, readFileSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

const LOCAL_URL = "http://localhost:8080";
const deployedRun = process.env.STIGI_E2E_TARGET === "deployed";

function productionUrl(): string {
  const fromEnv = process.env.STIGI_PROD_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (existsSync("e2e/production-url.txt")) {
    const fromFile = readFileSync("e2e/production-url.txt", "utf8").trim();
    if (fromFile) return fromFile.replace(/\/$/, "");
  }
  return "http://production-url-not-set.invalid";
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    viewport: { width: 1920, height: 1400 },
    trace: "retain-on-failure",
  },
  projects: [
    { name: "local", use: { baseURL: LOCAL_URL } },
    { name: "deployed", use: { baseURL: productionUrl() } },
  ],
  ...(deployedRun
    ? {}
    : {
        webServer: {
          command: "pnpm exec agent-native dev --port 8080 --strictPort",
          url: `${LOCAL_URL}/_agent-native/ping`,
          reuseExistingServer: true,
          timeout: 240_000,
          env: {
            AGENT_NATIVE_DISABLE_AUTO_DEV_ACCOUNT: "1",
            DO_NOT_TRACK: "1",
            AGENT_NATIVE_TELEMETRY_DISABLED: "1",
          },
        },
      }),
});
