import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("agent instructions", () => {
  it("AGENTS.md carries the Stigi section with its invariants", () => {
    const agents = readFileSync("AGENTS.md", "utf8");
    expect(agents).toContain("## Stigi — feedback board agent");
    expect(agents).toContain("one-line reason");
    expect(agents).toContain("sample data");
    expect(agents).toContain("`teach-cluster`");
  });

  it("the teach-cluster skill is one short turn with one move-notes call", () => {
    const skill = readFileSync(".agents/skills/teach-cluster/SKILL.md", "utf8");
    expect(skill.startsWith("---\nname: teach-cluster\n")).toBe(true);
    expect(skill).toContain("rename-cluster");
    expect(skill).toContain('scope: "outside-cluster"');
    expect(skill).toContain("move-notes");
    expect(skill).toContain("ONCE");
    expect(skill).toContain("At most 20");
  });
});
