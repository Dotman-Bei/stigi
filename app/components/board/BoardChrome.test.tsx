// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BoardTopBar, type BoardTopBarProps } from "./BoardTopBar";
import { EmptyBoard } from "./EmptyBoard";
import { SelectionBar } from "./SelectionBar";

afterEach(() => cleanup());

function topBar(overrides: Partial<BoardTopBarProps> = {}) {
  const props: BoardTopBarProps = {
    totalNotes: 200, themeCount: 6, unsortedCount: 50, sampleNotes: 200,
    usage: { used: 28, limit: 40, remaining: 12, resetsAt: "2026-11-10T00:00:00.000Z" },
    agentRunning: false, autoTeach: true, onAutoTeachChange: vi.fn(),
    sorting: false, onSortToggle: vi.fn(), onImportCsv: vi.fn(), onOpenReport: vi.fn(), onResetBoard: vi.fn(),
    ...overrides,
  };
  render(<BoardTopBar {...props} />);
  return props;
}

describe("EmptyBoard", () => {
  it("offers exactly one obvious action plus a quiet CSV link", () => {
    const onLoad = vi.fn();
    const onImport = vi.fn();
    render(<EmptyBoard loading={false} onLoadSample={onLoad} onImportCsv={onImport} />);
    expect(screen.getByRole("heading", { name: "Sort customer feedback with an agent" })).toBeTruthy();
    expect(screen.getByText(/200 synthetic sample comments for a fictional expenses app, already roughly sorted/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Load sample data (200 notes)" }));
    expect(onLoad).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "or import your own CSV" }));
    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it("hides the CSV link until import is wired", () => {
    render(<EmptyBoard loading={true} onLoadSample={vi.fn()} onImportCsv={null} />);
    expect(screen.queryByRole("button", { name: "or import your own CSV" })).toBeNull();
    expect((screen.getByRole("button", { name: "Loading sample…" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("BoardTopBar", () => {
  it("labels sample data and shows counts and remaining agent turns", () => {
    topBar();
    expect(screen.getByRole("heading", { name: "Feedback board" })).toBeTruthy();
    expect(screen.getByText("Sample data · pre-sorted starting layout")).toBeTruthy();
    expect(screen.getByText("200 notes · 6 themes · 50 unsorted")).toBeTruthy();
    expect(screen.getByText("12 of 40 agent turns left today")).toBeTruthy();
  });

  it("hides the sample chip for non-sample boards and controls whose handler is null", () => {
    topBar({ sampleNotes: 0, onSortToggle: null, onImportCsv: null, onOpenReport: null, onResetBoard: null });
    expect(screen.queryByText("Sample data · pre-sorted starting layout")).toBeNull();
    expect(screen.queryByRole("button", { name: "Sort with agent" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Import CSV" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Report" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Reset board" })).toBeNull();
  });

  it("explains spent demo credits and disables sorting", () => {
    topBar({ usage: { used: 40, limit: 40, remaining: 0, resetsAt: "2026-11-10T00:00:00.000Z" } });
    expect(screen.getByRole("status").textContent).toContain("Demo credits for today are used");
    expect((screen.getByRole("button", { name: "Sort with agent" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("toggles sorting, auto-teach and confirms a reset on the second click", () => {
    const props = topBar({ sorting: true });
    fireEvent.click(screen.getByRole("button", { name: "Stop sorting" }));
    expect(props.onSortToggle).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("switch", { name: "Auto-teach" }));
    expect(props.onAutoTeachChange).toHaveBeenCalledWith(false);
    fireEvent.click(screen.getByRole("button", { name: "Reset board" }));
    expect(props.onResetBoard).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Click again to reset" }));
    expect(props.onResetBoard).toHaveBeenCalledTimes(1);
  });
});

describe("SelectionBar", () => {
  it("appears with a selection and teaches only with two or more notes", () => {
    const onMore = vi.fn();
    const { rerender } = render(<SelectionBar count={0} canTeach={true} onMoreLikeThese={onMore} onClear={vi.fn()} />);
    expect(screen.queryByText(/selected/)).toBeNull();
    rerender(<SelectionBar count={1} canTeach={true} onMoreLikeThese={onMore} onClear={vi.fn()} />);
    expect((screen.getByRole("button", { name: "More like these" }) as HTMLButtonElement).disabled).toBe(true);
    rerender(<SelectionBar count={2} canTeach={true} onMoreLikeThese={onMore} onClear={vi.fn()} />);
    expect(screen.getByText("2 selected")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "More like these" }));
    expect(onMore).toHaveBeenCalledTimes(1);
  });
});
