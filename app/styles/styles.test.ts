import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const tokens = readFileSync("app/styles/stigi-tokens.css", "utf8");
const board = readFileSync("app/styles/board.css", "utf8");

describe("Stigi styles", () => {
  it("carries the dealt olive-on-bone palette and Host Grotesk + JetBrains Mono", () => {
    expect(tokens).toContain(".stigi-route,");
    expect(tokens).toContain("--p-bg: #ecebe7;");
    expect(tokens).toContain("--p-ink: #38450f;");
    expect(tokens).toContain('--font-display: "Host Grotesk"');
    expect(tokens).toContain('--font-mono: "JetBrains Mono"');
    expect(tokens).toContain("--r-btn: 8px;");
  });

  it("uses tokens, one button pair, the hover lift and a reduced-motion rest state", () => {
    expect(board).toContain(".stigi-btn--primary");
    expect(board).toContain(".stigi-btn--secondary");
    expect(board).toContain("translateY(-2px)");
    expect(board).toContain("@media (prefers-reduced-motion: reduce)");
    expect(board).toContain('[data-highlighted="true"]');
  });

  it("contains no violet", () => {
    for (const css of [tokens, board]) {
      expect(css.toLowerCase()).not.toMatch(/#(8b5cf6|7c3aed|a78bfa|6d28d9|c4b5fd|ddd6fe)|violet|lavender/);
    }
  });
});
