import { describe, expect, it } from "vitest";

import { actorFromCtx } from "./caller.js";
import { requireOwner } from "./owner.js";

describe("requireOwner", () => {
  it("returns the trimmed signed-in email", () => {
    expect(requireOwner({ userEmail: " ada@stigi.test " })).toBe("ada@stigi.test");
  });

  it("fails when nobody is signed in", () => {
    expect(() => requireOwner(undefined)).toThrow(/Sign in to use Stigi/);
    expect(() => requireOwner({ userEmail: "" })).toThrow(/Sign in to use Stigi/);
  });
});

describe("actorFromCtx", () => {
  it("maps the agent tool caller to agent and every other caller to user", () => {
    expect(actorFromCtx({ caller: "tool" })).toBe("agent");
    expect(actorFromCtx({ caller: "frontend" })).toBe("user");
    expect(actorFromCtx({ caller: "cli" })).toBe("user");
    expect(actorFromCtx(undefined)).toBe("user");
  });
});
