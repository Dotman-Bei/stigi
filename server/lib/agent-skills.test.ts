import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("sort and report skills", () => {
  it("sort-feedback processes one batch of at most 25 with one move-notes call", () => {
    const skill = readFileSync(".agents/skills/sort-feedback/SKILL.md", "utf8");
    expect(skill.startsWith("---\nname: sort-feedback\n")).toBe(true);
    expect(skill).toContain('scope: "unsorted", limit: 25');
    expect(skill).toContain("view-screen");
    expect(skill).toContain("ONCE");
    expect(skill).toContain("Then stop");
  });

  it("write-report uses the digest, keeps the sample label and opens the report", () => {
    const skill = readFileSync(".agents/skills/write-report/SKILL.md", "utf8");
    expect(skill.startsWith("---\nname: write-report\n")).toBe(true);
    expect(skill).toContain("get-board-digest");
    expect(skill).toContain("save-report");
    expect(skill).toContain('navigate` with `{ view: "report" }');
    expect(skill).toContain("sample data");
    expect(skill).toContain("verbatim");
  });
});
