import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { checkCrons, checkFunctionConfigs, findKeyLeaks, readFunctionConfigs } from "./vercel-output.mjs";

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value));
}

describe("vercel output checks", () => {
  it("reads every function config and requires >= 60 s on agent-chat and the server", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stigi-vc-"));
    writeJson(path.join(dir, "__server.func/.vc-config.json"), { maxDuration: 60 });
    writeJson(path.join(dir, "_agent-native/agent-chat.func/.vc-config.json"), { maxDuration: 60 });
    writeJson(path.join(dir, "_agent-native/agent-chat-stream.func/.vc-config.json"), { maxDuration: 10 });
    writeJson(path.join(dir, "__server.func/node_modules/pkg/.vc-config.json"), { maxDuration: 1 });
    const configs = readFunctionConfigs(dir);
    expect(configs.map((c) => c.fn).sort()).toEqual([
      "__server.func",
      "_agent-native/agent-chat-stream.func",
      "_agent-native/agent-chat.func",
    ]);
    const result = checkFunctionConfigs(configs);
    expect(result.agentChatCount).toBe(2);
    expect(result.problems).toEqual(["_agent-native/agent-chat-stream.func maxDuration=10 (< 60)"]);
  });

  it("fails when no agent-chat function exists", () => {
    const result = checkFunctionConfigs([{ fn: "__server.func", maxDuration: 60 }]);
    expect(result.problems[0]).toMatch(/no _agent-native\/agent-chat function/);
  });

  it("accepts only a daily sweep cron", () => {
    const sweepPath = "/_agent-native/jobs/_process-sweep";
    expect(checkCrons({ crons: [{ path: sweepPath, schedule: "0 9 * * *" }] })).toEqual([]);
    expect(checkCrons({ crons: [{ path: sweepPath, schedule: "* * * * *" }] })[0]).toMatch(/not daily/);
    expect(checkCrons({})[0]).toMatch(/missing/);
  });

  it("finds an OpenRouter key prefix in client assets", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stigi-static-"));
    fs.mkdirSync(path.join(dir, "assets"), { recursive: true });
    fs.writeFileSync(path.join(dir, "assets/ok.js"), "const label = 'OPENROUTER_API_KEY';");
    fs.writeFileSync(path.join(dir, "assets/bad.js"), "const k = 'sk-or-v1-abc';");
    expect(findKeyLeaks(dir)).toEqual([path.join("assets", "bad.js")]);
    expect(findKeyLeaks(path.join(dir, "missing"))).toEqual([]);
  });
});
