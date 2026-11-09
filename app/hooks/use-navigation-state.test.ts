// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { navigationStateForPath, pathForCommand } from "./use-navigation-state";

describe("Stigi navigation views", () => {
  it("maps the board routes to the board and report views", () => {
    expect(navigationStateForPath("/board").view).toBe("board");
    expect(navigationStateForPath("/board/report").view).toBe("report");
  });

  it("maps agent navigate commands to the board routes", () => {
    expect(pathForCommand({ view: "board" })).toBe("/board");
    expect(pathForCommand({ view: "report" })).toBe("/board/report");
  });

  it("keeps the template's home view", () => {
    expect(navigationStateForPath("/home").view).toBe("home");
  });
});
