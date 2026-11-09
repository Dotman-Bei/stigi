import { describe, expect, it } from "vitest";

import { checkEnvNames, parseEnvNames, PROBE_FLAG, REQUIRED_PRODUCTION_ENV } from "./vercel-env.mjs";

const SAMPLE_OUTPUT = [
  "Vercel CLI 65.12.1",
  "> Environment Variables found for dotman/stigi [180ms]",
  "",
  " name                              value               environments        created",
  " DATABASE_URL                      Encrypted           Production          2m ago",
  " BETTER_AUTH_SECRET                Encrypted           Production          2m ago",
  " STIGI_ENABLE_PROBE                Encrypted           Production          1m ago",
].join("\n");

describe("vercel env checks", () => {
  it("parses variable names and never values", () => {
    const names = parseEnvNames(SAMPLE_OUTPUT);
    expect([...names].sort()).toEqual(["BETTER_AUTH_SECRET", "DATABASE_URL", "STIGI_ENABLE_PROBE"]);
  });

  it("reports every missing required name", () => {
    const problems = checkEnvNames(new Set(["DATABASE_URL"]), {});
    expect(problems).toContain("missing BETTER_AUTH_SECRET");
    expect(problems).toContain("missing OPENROUTER_API_KEY");
    expect(problems).not.toContain("missing DATABASE_URL");
  });

  it("rejects the probe flag unless allowed, and can require it", () => {
    const all = new Set([...REQUIRED_PRODUCTION_ENV, PROBE_FLAG]);
    expect(checkEnvNames(all, {})).toEqual([`${PROBE_FLAG} must be removed after the probe check`]);
    expect(checkEnvNames(all, { allowProbe: true })).toEqual([]);
    expect(checkEnvNames(new Set(REQUIRED_PRODUCTION_ENV), { allowProbe: true, requireProbe: true })).toEqual([
      `missing ${PROBE_FLAG} (set it for the skeleton probe step)`,
    ]);
  });

  it("forbids AUTH_DISABLED in production", () => {
    const names = new Set([...REQUIRED_PRODUCTION_ENV, "AUTH_DISABLED"]);
    expect(checkEnvNames(names, {})).toEqual(["forbidden AUTH_DISABLED (sign-in must stay required)"]);
  });
});
