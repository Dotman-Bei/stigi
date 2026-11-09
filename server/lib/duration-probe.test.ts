import { describe, expect, it } from "vitest";

import { clampProbeMs, isProbeEnabled, PROBE_MAX_MS } from "./duration-probe.js";

describe("clampProbeMs", () => {
  it("parses query strings and numbers and clamps to 0..70000", () => {
    expect(clampProbeMs("45000")).toBe(45000);
    expect(clampProbeMs(58000)).toBe(58000);
    expect(clampProbeMs("999999")).toBe(PROBE_MAX_MS);
    expect(clampProbeMs("-5")).toBe(0);
    expect(clampProbeMs("abc")).toBe(0);
    expect(clampProbeMs(undefined)).toBe(0);
    expect(clampProbeMs("1234.9")).toBe(1234);
  });
});

describe("isProbeEnabled", () => {
  it("is always on outside production", () => {
    expect(isProbeEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(isProbeEnabled({})).toBe(true);
  });

  it("is off in production unless STIGI_ENABLE_PROBE is exactly 1", () => {
    expect(isProbeEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(isProbeEnabled({ NODE_ENV: "production", STIGI_ENABLE_PROBE: "0" })).toBe(false);
    expect(isProbeEnabled({ NODE_ENV: "production", STIGI_ENABLE_PROBE: "true" })).toBe(false);
    expect(isProbeEnabled({ NODE_ENV: "production", STIGI_ENABLE_PROBE: "1" })).toBe(true);
  });
});
