import { beforeEach, describe, expect, it, vi } from "vitest";

const { readAppStateForCurrentTab } = vi.hoisted(() => ({ readAppStateForCurrentTab: vi.fn() }));
vi.mock("@agent-native/core/application-state", () => ({ readAppStateForCurrentTab }));

import { resetTestDb } from "../server/db/test-db.js";
import getBoard from "./get-board.js";
import importNotes from "./import-notes.js";
import viewScreen from "./view-screen.js";

const user = { userEmail: "ada@stigi.test", caller: "frontend" as const };
const agent = { userEmail: "ada@stigi.test", caller: "tool" as const };

describe("view-screen", () => {
  beforeEach(async () => {
    await resetTestDb();
    readAppStateForCurrentTab.mockReset();
    await importNotes.run({ sample: true }, user);
  });

  it("returns navigation, selection, a board summary and the selected notes and cluster", async () => {
    const board = await getBoard.run({}, user);
    const cluster = board.clusters[1];
    const picked = (cluster?.notes ?? []).slice(0, 2).map((n) => n.id);
    readAppStateForCurrentTab.mockImplementation(async (key: string) => {
      if (key === "navigation") return { view: "board", path: "/board" };
      if (key === "selection") return { kind: "stigi.board", noteIds: picked, clusterId: cluster?.id ?? null, capturedAt: "2026-11-09T10:00:00Z" };
      return null;
    });
    const screen = await viewScreen.run({}, agent);
    expect(screen.navigation).toEqual({ view: "board", path: "/board" });
    expect(screen.board.clusters).toHaveLength(6);
    expect(screen.board.clusters[1]).toEqual({ id: cluster?.id, name: "Mobile app", noteCount: 25, createdBy: "sample" });
    expect(screen.board.unsortedCount).toBe(50);
    expect(screen.board.sampleNotes).toBe(200);
    expect(screen.selectedNotes.map((n) => n.id)).toEqual(picked);
    expect(screen.selectedNotes[0]?.cluster).toBe("Mobile app");
    expect(screen.selectedCluster?.name).toBe("Mobile app");
    expect(screen.selectedCluster?.notes).toHaveLength(20);
  });

  it("ignores selection state of another kind", async () => {
    readAppStateForCurrentTab.mockImplementation(async (key: string) => (key === "selection" ? { kind: "other", noteIds: ["x"] } : null));
    const screen = await viewScreen.run({}, agent);
    expect(screen.selection).toBeNull();
    expect(screen.selectedNotes).toEqual([]);
    expect(screen.selectedCluster).toBeNull();
  });
});
